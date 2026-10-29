import { BadRequestException } from '@nestjs/common';
import { resolveStorageKey, STORAGE_ROOT } from './storage.paths';

describe('resolveStorageKey (path traversal guard)', () => {
  it('resolves a normal key inside the storage root', () => {
    const resolved = resolveStorageKey('templates/invoice.docx');
    expect(resolved.startsWith(`${STORAGE_ROOT}/`)).toBe(true);
    expect(resolved.endsWith('templates/invoice.docx')).toBe(true);
  });

  it('resolves nested thumbnail keys', () => {
    expect(() => resolveStorageKey('assets/thumbs/lesson-plan/slide-01.svg')).not.toThrow();
  });

  it.each([
    '../../etc/passwd',
    '../../../etc/passwd',
    'templates/../../../etc/passwd',
    'assets/thumbs/../../../../dev.db',
    '/etc/passwd', // absolute paths win path.resolve -> outside root
  ])('rejects traversal-shaped key %s', (key) => {
    expect(() => resolveStorageKey(key)).toThrow(BadRequestException);
    expect(() => resolveStorageKey(key)).toThrow(/escapes the storage root/);
  });

  it('rejects empty or non-string keys', () => {
    expect(() => resolveStorageKey('')).toThrow(BadRequestException);
    // @ts-expect-error deliberate misuse check at the boundary
    expect(() => resolveStorageKey(undefined)).toThrow(BadRequestException);
  });

  it('accepts a key that normalizes to the storage root itself', () => {
    // "templates/.." collapses to the root — still inside (equal) boundary.
    expect(resolveStorageKey('templates/..')).toBe(STORAGE_ROOT);
  });
});
