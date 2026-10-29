// Pure-string SVG preview builders — plain shapes + <text> only.
// No <script>, no <foreignObject>, no external references: CSP/sanitizer-safe.
import type { DeckSpec, DocSpec, SlideSpec } from '../specs/spec-types';
import { layoutSlide } from './slide-layout';

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const n = (value: number): string => String(Math.round(value * 100) / 100);

/** PPTX slide preview: 1280x720 (16:9, mirrors LAYOUT_16x9). */
export function slideSvg(slide: SlideSpec, spec: DeckSpec): string {
  const view = { w: 1280, h: 720 };
  const layout = layoutSlide(slide, spec.palette);
  const pxPerPt = 128 / 72;
  const parts: string[] = [
    `<svg ${SVG_NS} viewBox="0 0 ${view.w} ${view.h}" width="${view.w}" height="${view.h}">`,
    `<rect x="0" y="0" width="${view.w}" height="${view.h}" fill="#${layout.bg}"/>`,
  ];
  for (const s of layout.shapes) {
    const attrs = `x="${n(s.x * view.w)}" y="${n(s.y * view.h)}" width="${n(s.w * view.w)}" height="${n(s.h * view.h)}"`;
    const opacity = s.transparency ? ` fill-opacity="${n(1 - s.transparency / 100)}"` : '';
    parts.push(
      s.kind === 'rect'
        ? `<rect ${attrs} fill="#${s.fill}"${opacity}/>`
        : `<ellipse cx="${n((s.x + s.w / 2) * view.w)}" cy="${n((s.y + s.h / 2) * view.h)}" rx="${n((s.w * view.w) / 2)}" ry="${n((s.h * view.h) / 2)}" fill="#${s.fill}"${opacity}/>`,
    );
  }
  for (const t of layout.texts) {
    if (!t.text) continue;
    const x = t.align === 'center' ? n((t.x + t.w / 2) * view.w) : n(t.x * view.w);
    const anchor = t.align === 'center' ? 'middle' : t.align === 'right' ? 'end' : 'start';
    const baseline = n((t.y + 0.05) * view.h + t.fontSize * pxPerPt * 0.35);
    parts.push(
      `<text x="${x}" y="${baseline}" font-family="${spec.fontFace}, Arial, sans-serif" font-size="${n(t.fontSize * pxPerPt)}" fill="#${t.color}" text-anchor="${anchor}"${t.bold ? ' font-weight="bold"' : ''}>${escapeXml(t.text)}</text>`,
    );
  }
  parts.push('</svg>');
  return parts.join('\n');
}

/** DOCX card preview: 900x1165 (~A4 ratio), derived from the same DocSpec. */
export function docxCardSvg(spec: DocSpec): string {
  const w = 900;
  const h = 1165;
  const firstHeading = spec.blocks.find((b) => b.type === 'heading' && b.level === 1);
  const firstPara = spec.blocks.find((b) => b.type === 'para');
  const paraText = firstPara
    ? firstPara.runs.map((r) => r.text).join('').slice(0, 96)
    : spec.description;
  const headingText = firstHeading ? firstHeading.text : spec.name;
  const bodyLines = [paraText.slice(0, 48), paraText.slice(48, 96)].filter((s) => s.length > 0);
  const parts: string[] = [
    `<svg ${SVG_NS} viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<rect x="0" y="0" width="${w}" height="${h}" fill="#${spec.palette.bg}"/>`,
    `<rect x="0" y="0" width="${w}" height="190" fill="#${spec.palette.accent}"/>`,
    `<rect x="60" y="160" width="140" height="12" fill="#${spec.palette.accent2}"/>`,
    `<text x="60" y="105" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#FFFFFF">${escapeXml(spec.name)}</text>`,
    `<text x="60" y="150" font-family="Arial, sans-serif" font-size="20" fill="#E5E7EB">${escapeXml(spec.category)} · Word document</text>`,
    `<text x="60" y="300" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#${spec.palette.text}">${escapeXml(headingText.slice(0, 40))}</text>`,
  ];
  let y = 360;
  const maxLines = Math.min(bodyLines.length, 2);
  for (let i = 0; i < maxLines; i++) {
    parts.push(
      `<text x="60" y="${y}" font-family="Arial, sans-serif" font-size="21" fill="#${spec.palette.muted}">${escapeXml(bodyLines[i])}</text>`,
    );
    y += 40;
  }
  // Miniature table hint
  parts.push(
    `<rect x="60" y="470" width="780" height="56" fill="#${spec.palette.accent}" fill-opacity="0.9"/>`,
    `<rect x="60" y="526" width="780" height="56" fill="#F3F4F6"/>`,
    `<rect x="60" y="582" width="780" height="56" fill="#F9FAFB"/>`,
    `<text x="80" y="505" font-family="Arial, sans-serif" font-size="20" fill="#FFFFFF">Line items</text>`,
    `<text x="80" y="561" font-family="Arial, sans-serif" font-size="20" fill="#6B7280">Quantity · Unit price · Amount</text>`,
    `<text x="80" y="617" font-family="Arial, sans-serif" font-size="20" fill="#9CA3AF">Created from the office-template-library</text>`,
    `<rect x="0" y="${h - 60}" width="${w}" height="60" fill="#${spec.palette.accent2}"/>`,
    `<text x="60" y="${h - 22}" font-family="Arial, sans-serif" font-size="20" fill="#FFFFFF">${escapeXml(spec.description.slice(0, 74))}</text>`,
    '</svg>',
  );
  return parts.join('\n');
}
