// DocumentsService spec — mocked registry + mocked prisma, real fs tmpdir:
// the injected DocxHandler is real, so create() actually converts a real
// fixture docx into contentHtml inside the tmpdir.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NotImplementedException } from '@nestjs/common';
import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import { PrismaService } from '../prisma/prisma.service';
import * as storagePaths from '../storage/storage.paths';
import { DocxHandler } from '../office/docx.handler';
import type { OfficeHandler } from '../office/office-handler.interface';
import type { OfficeHandlerRegistry } from '../office/office-handler.registry';
import { DocumentsService } from './documents.service';

let root: string;
beforeAll(async () => {
  root = mkdtempSync(path.join(os.tmpdir(), 'documents-service-spec-'));
  jest
    .spyOn(storagePaths, 'resolveStorageKey')
    .mockImplementation((key: string) => path.join(root, key));
  // Real docx fixture the fake template row points at.
  const buffer = await Packer.toBuffer(
    new Document({
      sections: [{ children: [new Paragraph({ text: 'Svc Fixture', heading: HeadingLevel.HEADING_2 })] }],
    }),
  );
  await mkdir(path.join(root, 'templates'), { recursive: true });
  await writeFile(path.join(root, 'templates/fixture.docx'), buffer);
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

const prisma = {
  template: { findUnique: jest.fn() },
  document: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
} as unknown as PrismaService;

// Mocked registry: docx resolves to a handler whose copy is a REAL fs copy
// within the tmpdir (the service's storageKey contract stays under test);
// pptx mimics the unregistered-kind 501 behavior.
const copyMock = jest.fn(async (srcKey: string, dstKey: string) => {
  mkdirSync(path.dirname(path.join(root, dstKey)), { recursive: true });
  copyFileSync(path.join(root, srcKey), path.join(root, dstKey));
});
const docxishHandler: OfficeHandler = {
  kind: 'docx',
  createDocumentCopy: copyMock,
  exportDocument: async () => undefined,
};
const getHandler = jest.fn((kind: string) => {
  if (kind !== 'docx') {
    throw new NotImplementedException(`No office handler registered for kind "${kind}"`);
  }
  return docxishHandler;
});
const registry = { getHandler } as unknown as OfficeHandlerRegistry;

const service = new DocumentsService(prisma, registry, new DocxHandler());

const docxTemplate = { id: 't-1', kind: 'docx', name: 'Resume', storageKey: 'templates/fixture.docx' };
const storedRow = {
  id: 'd-1',
  templateId: 't-1',
  kind: 'docx',
  title: 'Resume',
  storageKey: 'documents/d-1.docx',
  contentHtml: '<h2>Svc Fixture</h2>',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  template: { name: 'Resume' },
};

beforeEach(() => {
  jest.clearAllMocks(); // clears call counts, keeps implementations
  (prisma.template.findUnique as jest.Mock).mockResolvedValue(docxTemplate);
  (prisma.document.create as jest.Mock).mockImplementation(({ data }) => ({ ...storedRow, ...data }));
});

describe('DocumentsService.create', () => {
  it('copies the template, extracts real contentHtml and creates the row', async () => {
    const result = await service.create({ templateId: 't-1' });

    expect(copyMock).toHaveBeenCalledWith(
      'templates/fixture.docx',
      expect.stringMatching(/^documents\/[0-9a-f-]{36}\.docx$/),
    );
    const data = (prisma.document.create as jest.Mock).mock.calls[0][0].data;
    expect(existsSync(path.join(root, data.storageKey))).toBe(true);
    expect(data.contentHtml).toContain('<h2>Svc Fixture</h2>');
    expect(data.title).toBe('Resume');
    expect(result.contentHtml).toContain('<h2>Svc Fixture</h2>');
  });

  it('throws 404 for an unknown template', async () => {
    (prisma.template.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.create({ templateId: 'nope' })).rejects.toThrow('Template nope not found');
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('propagates the registry 501 for pptx (no handler registered yet)', async () => {
    (prisma.template.findUnique as jest.Mock).mockResolvedValue({ ...docxTemplate, kind: 'pptx' });
    await expect(service.create({ templateId: 't-1' })).rejects.toThrow(NotImplementedException);
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('cleans up the copied file when the row insert fails', async () => {
    (prisma.document.create as jest.Mock).mockRejectedValue(new Error('db down'));
    await expect(service.create({ templateId: 't-1' })).rejects.toThrow('db down');
    const dstKey = copyMock.mock.calls[0][1];
    expect(existsSync(path.join(root, dstKey))).toBe(false);
  });
});

describe('DocumentsService read paths', () => {
  it('list() maps rows to the list DTO', async () => {
    (prisma.document.findMany as jest.Mock).mockResolvedValue([storedRow]);
    expect(await service.list()).toEqual([
      { id: 'd-1', title: 'Resume', kind: 'docx', templateName: 'Resume', updatedAt: storedRow.updatedAt },
    ]);
  });

  it('detail() throws 404 for unknown ids', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.detail('missing')).rejects.toThrow('Document missing not found');
  });
});

describe('DocumentsService.update (partial)', () => {
  it('title-only PATCH does not touch contentHtml', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(storedRow);
    (prisma.document.update as jest.Mock).mockResolvedValue({ ...storedRow, title: 'New Title' });
    const result = await service.update('d-1', { title: 'New Title' });
    const arg = (prisma.document.update as jest.Mock).mock.calls[0][0];
    expect(arg.data).toEqual({ title: 'New Title' });
    expect('contentHtml' in arg.data).toBe(false);
    expect(result.title).toBe('New Title');
  });

  it('rejects contentHtml on non-docx documents', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue({ ...storedRow, kind: 'pptx' });
    await expect(service.update('d-1', { contentHtml: '<p>x</p>' })).rejects.toThrow('docx documents only');
  });

  it('throws 404 for unknown ids', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.update('missing', { title: 'x' })).rejects.toThrow('not found');
  });
});

describe('DocumentsService.export', () => {
  it('renders a docx buffer with a slugified filename and the OOXML mime', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(storedRow);
    const file = await service.export('d-1');
    expect(file.filename).toBe('resume.docx');
    expect(file.mime).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(file.buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('throws 501 for non-docx kinds', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue({ ...storedRow, kind: 'pptx' });
    await expect(service.export('d-1')).rejects.toThrow(NotImplementedException);
  });
});
