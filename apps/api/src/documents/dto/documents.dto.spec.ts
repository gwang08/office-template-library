// Unit: Create/UpdateDocumentDto through the REAL ValidationPipe configured
// exactly like main.ts (whitelist + transform + forbidNonWhitelisted) —
// matrix item 5. No DB, no HTTP: this pins the validation contract the e2e
// suites then observe end-to-end.
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateDocumentDto } from './create-document.dto';
import { UpdateDocumentDto } from './update-document.dto';

const pipe = () =>
  new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });

/** Runs the pipe like Nest would for a @Body() argument; rejects via 400. */
const validateBody = <T extends object>(metatype: new () => T, value: unknown) =>
  pipe().transform(value, { type: 'body', metatype, data: '' });

const expectBadRequest = async (promise: Promise<unknown>, pattern: RegExp) => {
  await expect(promise).rejects.toThrow(BadRequestException);
  await promise.catch((error: BadRequestException) => {
    const response = error.getResponse() as { message: string[] | string };
    const message = Array.isArray(response.message) ? response.message.join(' ') : response.message;
    expect(message).toMatch(pattern);
  });
};

describe('CreateDocumentDto (ValidationPipe)', () => {
  const validId = '44444444-4444-4444-8444-444444444444';

  it('accepts a valid templateId and returns a transformed DTO instance', async () => {
    const result = await validateBody(CreateDocumentDto, { templateId: validId });
    expect(result).toBeInstanceOf(CreateDocumentDto);
    expect(result.templateId).toBe(validId);
  });

  it('rejects a missing templateId', () =>
    expectBadRequest(validateBody(CreateDocumentDto, {}), /templateId/i));

  it('rejects a traversal-shaped non-uuid templateId', () =>
    expectBadRequest(validateBody(CreateDocumentDto, { templateId: '../../etc/passwd' }), /uuid/i));

  it('rejects unknown fields (forbidNonWhitelisted)', () =>
    expectBadRequest(
      validateBody(CreateDocumentDto, { templateId: validId, evil: 'x' }),
      /property evil should not exist/,
    ));
});

describe('UpdateDocumentDto (ValidationPipe)', () => {
  it('accepts an empty patch (strictly partial: every field optional)', async () => {
    const result = await validateBody(UpdateDocumentDto, {});
    expect(result).toBeInstanceOf(UpdateDocumentDto);
    expect(result.title).toBeUndefined();
    expect(result.contentHtml).toBeUndefined();
  });

  it('accepts a title-only patch', async () => {
    const result = await validateBody(UpdateDocumentDto, { title: 'Renamed' });
    expect(result.title).toBe('Renamed');
  });

  it('rejects an oversize title (DoS guard, 200 chars max)', () =>
    expectBadRequest(validateBody(UpdateDocumentDto, { title: 'x'.repeat(201) }), /title/i));

  it('rejects an oversize contentHtml (2MB cap)', () =>
    expectBadRequest(
      validateBody(UpdateDocumentDto, { contentHtml: 'x'.repeat(2_000_001) }),
      /contentHtml/i,
    ));

  it('rejects unknown fields (forbidNonWhitelisted)', () =>
    expectBadRequest(
      validateBody(UpdateDocumentDto, { title: 'x', templateId: 'nope' }),
      /property templateId should not exist/,
    ));
});
