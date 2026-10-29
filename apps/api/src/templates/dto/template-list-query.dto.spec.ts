// Unit: TemplateListQueryDto through the REAL ValidationPipe (query mode) —
// matrix item 5, query half: enum kind guard, empty-to-undefined transform
// and length caps that the e2e templates suite observes end-to-end.
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { TemplateListQueryDto } from './template-list-query.dto';

const validateQuery = (value: Record<string, unknown>) =>
  new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }).transform(
    value,
    { type: 'query', metatype: TemplateListQueryDto, data: '' },
  );

const expectBadRequest = async (promise: Promise<unknown>, pattern: RegExp) => {
  await expect(promise).rejects.toThrow(BadRequestException);
  await promise.catch((error: BadRequestException) => {
    const response = error.getResponse() as { message: string[] | string };
    const message = Array.isArray(response.message) ? response.message.join(' ') : response.message;
    expect(message).toMatch(pattern);
  });
};

describe('TemplateListQueryDto (ValidationPipe, query mode)', () => {
  it('accepts an empty query (no filters)', async () => {
    const result = await validateQuery({});
    expect(result.kind).toBeUndefined();
    expect(result.search).toBeUndefined();
  });

  it('accepts valid filters and keeps their values', async () => {
    const result = await validateQuery({ kind: 'docx', category: 'Finance', search: 'invoice' });
    expect(result).toEqual({ kind: 'docx', category: 'Finance', search: 'invoice' });
  });

  it('rejects an invalid kind with the enum message', () =>
    expectBadRequest(validateQuery({ kind: 'xls' }), /kind must be one of: docx, pptx/));

  it('treats empty-string filter values as "not provided"', async () => {
    const result = await validateQuery({ kind: '', category: '  ', search: '' });
    expect(result.kind).toBeUndefined();
    expect(result.category).toBeUndefined();
    expect(result.search).toBeUndefined();
  });

  it('rejects an oversize search term (120 chars max)', () =>
    expectBadRequest(validateQuery({ search: 'x'.repeat(121) }), /search/i));

  it('rejects unknown query params (forbidNonWhitelisted)', () =>
    expectBadRequest(validateQuery({ sort: 'name' }), /property sort should not exist/));
});
