import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildTemplateWhere, TemplatesService } from './templates.service';
import { TemplateListQueryDto } from './dto/template-list-query.dto';

describe('buildTemplateWhere (filter construction)', () => {
  it('returns an empty where for an empty query', () => {
    expect(buildTemplateWhere({} as TemplateListQueryDto)).toEqual({});
  });

  it('maps kind and category directly', () => {
    expect(buildTemplateWhere({ kind: 'docx' } as TemplateListQueryDto)).toEqual({ kind: 'docx' });
    expect(buildTemplateWhere({ category: 'Business' } as TemplateListQueryDto)).toEqual({
      category: 'Business',
    });
  });

  it('expands search into OR over name and description contains', () => {
    expect(buildTemplateWhere({ search: 'invoice' } as TemplateListQueryDto)).toEqual({
      OR: [{ name: { contains: 'invoice' } }, { description: { contains: 'invoice' } }],
    });
  });

  it('combines kind + search with implicit AND semantics', () => {
    const where = buildTemplateWhere({ kind: 'docx', search: 'invoice' } as TemplateListQueryDto);
    expect(where.kind).toBe('docx');
    expect(where.OR).toEqual([
      { name: { contains: 'invoice' } },
      { description: { contains: 'invoice' } },
    ]);
  });

  it('ignores whitespace-only search via DTO normalization contract', () => {
    // The DTO transform turns empty strings into undefined before this runs.
    const query = new TemplateListQueryDto();
    query.search = undefined;
    expect(buildTemplateWhere(query)).toEqual({});
  });
});

describe('TemplatesService', () => {
  const prisma = {
    template: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new TemplatesService(prisma);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('list() queries with the built where and maps slide counts', async () => {
    (prisma.template.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'a',
        name: 'Invoice',
        description: 'd',
        category: 'Finance',
        kind: 'docx',
        thumbnailKey: 'assets/thumbs/invoice/card.svg',
        _count: { slides: 0 },
      },
    ]);

    const result = await service.list({ kind: 'docx' } as TemplateListQueryDto);

    expect(prisma.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { kind: 'docx' }, orderBy: { name: 'asc' } }),
    );
    expect(result).toEqual([
      {
        id: 'a',
        name: 'Invoice',
        description: 'd',
        category: 'Finance',
        kind: 'docx',
        thumbnailKey: 'assets/thumbs/invoice/card.svg',
        slideCount: 0,
      },
    ]);
  });

  it('detail() throws NotFound for an unknown id', async () => {
    (prisma.template.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.detail('11111111-1111-4111-8111-111111111111')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('previewHtml() rejects non-docx templates with 400', async () => {
    (prisma.template.findUnique as jest.Mock).mockResolvedValue({
      id: 'p',
      kind: 'pptx',
      storageKey: 'templates/deck.pptx',
    });
    await expect(service.previewHtml('77777777-7777-4777-8777-777777777777')).rejects.toThrow(
      BadRequestException,
    );
  });
});
