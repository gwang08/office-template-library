import { slugifyDocxFilename } from './export-filename';

// The slug feeds a Content-Disposition header — these cases pin the
// header-injection guarantees (no CR/LF, quotes, non-ascii, empty output).
describe('slugifyDocxFilename', () => {
  it('slugs a plain title', () => {
    expect(slugifyDocxFilename('Q3 Business Proposal')).toBe('q3-business-proposal.docx');
  });

  it('strips header-injection payloads (CR/LF, quotes, semicolons)', () => {
    expect(slugifyDocxFilename('report\r\nSet-Cookie: pwned')).toBe('report-set-cookie-pwned.docx');
    expect(slugifyDocxFilename('My "Best"; Report')).toBe('my-best-report.docx');
  });

  it('has no non-ascii characters even after diacritics and unicode titles', () => {
    expect(slugifyDocxFilename('Résumé')).toBe('resume.docx');
    const cjk = slugifyDocxFilename('日本語タイトル');
    expect(cjk).toBe('document.docx');
    expect(cjk).toMatch(/^[\x20-\x7e]+$/);
  });

  it('falls back to document.docx for empty or separator-only titles', () => {
    expect(slugifyDocxFilename('')).toBe('document.docx');
    expect(slugifyDocxFilename('   ---   ')).toBe('document.docx');
  });

  it('caps the base length', () => {
    const slug = slugifyDocxFilename('a'.repeat(500));
    expect(slug.length).toBeLessThanOrEqual(80 + '.docx'.length);
    expect(slug.startsWith('a')).toBe(true);
  });
});
