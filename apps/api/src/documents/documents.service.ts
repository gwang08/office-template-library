// Documents application service: copy-on-use creation, list/detail, partial
// update and DOCX export. Kind dispatch goes through the OfficeHandlerRegistry
// seam (501 for kinds without a handler — pptx until Phase 05); the html
// capabilities are delegated to the concrete DocxHandler.
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OfficeHandlerRegistry } from '../office/office-handler.registry';
import { DOCX_MIME, DocxHandler } from '../office/docx.handler';
import { resolveStorageKey } from '../storage/storage.paths';
import { slugifyDocxFilename } from './export-filename';
import type { CreateDocumentDto } from './dto/create-document.dto';
import type { UpdateDocumentDto } from './dto/update-document.dto';
import type { OfficeKind } from '../office/office-handler.interface';

// DB boundary: Prisma `kind` is a plain string (SQLite has no enums) — narrow
// it before it enters the typed registry seam. Unknown kinds are seed data
// corruption, not a client error.
const isOfficeKind = (kind: string): kind is OfficeKind => kind === 'docx' || kind === 'pptx';

export interface DocumentListItem {
  id: string;
  title: string;
  kind: string;
  templateName: string;
  updatedAt: Date;
}

export interface DocumentDetail extends DocumentListItem {
  contentHtml: string | null;
  createdAt: Date;
}

export interface ExportedDocument {
  buffer: Buffer;
  filename: string;
  mime: string;
}

type DocumentRow = Prisma.DocumentGetPayload<{ include: { template: { select: { name: true } } } }>;

const withTemplate = { include: { template: { select: { name: true } } } };

const toListItem = (doc: DocumentRow): DocumentListItem => ({
  id: doc.id,
  title: doc.title,
  kind: doc.kind,
  templateName: doc.template.name,
  updatedAt: doc.updatedAt,
});

const toDetail = (doc: DocumentRow): DocumentDetail => ({
  ...toListItem(doc),
  contentHtml: doc.contentHtml,
  createdAt: doc.createdAt,
});

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: OfficeHandlerRegistry,
    private readonly docxHandler: DocxHandler,
  ) {}

  /**
   * Copy-on-use: the template file is only ever read (byte-for-byte copy);
   * the new document lives at storage/documents/{uuid}.{kind} — a
   * server-generated name no client input can influence.
   */
  async create(dto: CreateDocumentDto): Promise<DocumentDetail> {
    const template = await this.prisma.template.findUnique({ where: { id: dto.templateId } });
    if (!template) throw new NotFoundException(`Template ${dto.templateId} not found`);
    if (!isOfficeKind(template.kind)) {
      throw new InternalServerErrorException(`Template has an unknown kind: ${template.kind}`);
    }

    // 501 NotImplementedException for kinds without a handler (pptx: Phase 05).
    const handler = this.registry.getHandler(template.kind);
    const documentId = randomUUID();
    const storageKey = `documents/${documentId}.${template.kind}`;
    try {
      await handler.createDocumentCopy(template.storageKey, storageKey);
      const contentHtml =
        template.kind === 'docx' ? await this.docxHandler.extractHtml(storageKey) : null;
      const doc = await this.prisma.document.create({
        data: {
          // Row id == file name uuid: the copy is storage/documents/{docId}.docx
          id: documentId,
          templateId: template.id,
          kind: template.kind,
          title: template.name,
          storageKey,
          contentHtml,
        },
        ...withTemplate,
      });
      return toDetail(doc);
    } catch (error) {
      // Do not leave an orphaned copy behind when conversion or insert fails.
      await rm(resolveStorageKey(storageKey), { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async list(): Promise<DocumentListItem[]> {
    const documents = await this.prisma.document.findMany({
      orderBy: { updatedAt: 'desc' },
      ...withTemplate,
    });
    return documents.map(toListItem);
  }

  async detail(id: string): Promise<DocumentDetail> {
    return toDetail(await this.findDocument(id));
  }

  /** Partial update — only the fields present in the DTO are written. */
  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentDetail> {
    const doc = await this.findDocument(id);
    if (dto.contentHtml !== undefined && doc.kind !== 'docx') {
      throw new BadRequestException(`contentHtml applies to docx documents only (kind: ${doc.kind})`);
    }
    const data: { title?: string; contentHtml?: string } = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.contentHtml !== undefined) data.contentHtml = dto.contentHtml;
    const updated = await this.prisma.document.update({ where: { id }, data, ...withTemplate });
    return toDetail(updated);
  }

  async export(id: string): Promise<ExportedDocument> {
    const doc = await this.findDocument(id);
    if (doc.kind !== 'docx') {
      throw new NotImplementedException(`Export is not implemented for kind "${doc.kind}" yet`);
    }
    const buffer = await this.docxHandler.renderHtmlToDocx(doc.contentHtml ?? '');
    return { buffer, filename: slugifyDocxFilename(doc.title), mime: DOCX_MIME };
  }

  private async findDocument(id: string): Promise<DocumentRow> {
    const doc = await this.prisma.document.findUnique({ where: { id }, ...withTemplate });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }
}
