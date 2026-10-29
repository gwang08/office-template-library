// Templates application service: list/search/filter, detail with slides,
// file streaming and docx HTML preview (mammoth).
import { createReadStream } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { BadRequestException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { resolveStorageKey } from '../storage/storage.paths';
import type { TemplateListQueryDto } from './dto/template-list-query.dto';

/** OOXML MIME types by template kind. */
export const TEMPLATE_MIME: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/**
 * Pure where-clause builder (unit-tested without a DB).
 * Note: Prisma `mode: 'insensitive'` is unsupported on SQLite, but SQLite's
 * LIKE translation is already ASCII-case-insensitive, so plain `contains`
 * behaves case-insensitively for our search use case.
 */
export function buildTemplateWhere(query: TemplateListQueryDto): Prisma.TemplateWhereInput {
  const where: Prisma.TemplateWhereInput = {};
  if (query.kind) where.kind = query.kind;
  if (query.category) where.category = query.category;
  if (query.search) {
    const search = query.search;
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
  }
  return where;
}

export interface TemplateFile {
  stream: StreamableFile;
  mime: string;
  filename: string;
}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: TemplateListQueryDto) {
    const templates = await this.prisma.template.findMany({
      where: buildTemplateWhere(query),
      orderBy: { name: 'asc' },
      include: { _count: { select: { slides: true } } },
    });
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      kind: template.kind,
      thumbnailKey: template.thumbnailKey,
      slideCount: template._count.slides,
    }));
  }

  async detail(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { slides: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      kind: template.kind,
      thumbnailKey: template.thumbnailKey,
      slides: template.slides.map((slide) => ({
        order: slide.order,
        title: slide.title,
        previewKey: slide.previewKey,
      })),
    };
  }

  /** DOCX-only HTML preview (mammoth). Underline survives via styleMap. */
  async previewHtml(id: string): Promise<{ html: string; messages: string[] }> {
    const template = await this.findTemplate(id);
    if (template.kind !== 'docx') {
      throw new BadRequestException(`Preview is only available for docx templates (kind: ${template.kind})`);
    }
    const filePath = resolveStorageKey(template.storageKey);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Template file missing in storage: ${template.storageKey}`);
    }
    try {
      const result = await mammoth.convertToHtml({ path: filePath }, { styleMap: ['u => u'] });
      return { html: result.value, messages: result.messages.map((m) => m.message) };
    } catch (error) {
      throw new BadRequestException(`Could not convert template to HTML: ${(error as Error).message}`);
    }
  }

  async getFile(id: string): Promise<TemplateFile> {
    const template = await this.findTemplate(id);
    const filePath = resolveStorageKey(template.storageKey);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Template file missing in storage: ${template.storageKey}`);
    }
    return {
      stream: new StreamableFile(createReadStream(filePath)),
      mime: TEMPLATE_MIME[template.kind] ?? 'application/octet-stream',
      filename: path.basename(template.storageKey),
    };
  }

  private async findTemplate(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }
}
