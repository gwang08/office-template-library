// Export filename policy for GET /api/documents/:id/export.
// Content-Disposition carries a slug of the (user-editable) document title,
// so the slug must be ascii-safe: everything outside [a-z0-9-] is stripped,
// which makes CR/LF, quotes and other header-injection payloads structurally
// impossible in the header value.
const MAX_BASE_LENGTH = 80;

/** "Q3 Résumé — final!" -> "q3-resume-final.docx" (never empty). */
export function slugifyDocxFilename(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics decomposed by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, '');
  return `${base || 'document'}.docx`;
}
