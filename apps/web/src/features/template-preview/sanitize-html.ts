// Tiny allowlist HTML scrub for preview payloads rendered via
// dangerouslySetInnerHTML. Defense in depth: the HTML comes from our own
// committed docx files via mammoth (trusted), but scrub anyway — script-ish
// tags are dropped, unknown tags unwrapped, only allowlisted attributes
// survive (kills on* handlers), and URL attributes are scheme-checked.
const BLOCKED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta']);

const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'strong', 'b', 'em', 'i', 'u', 's',
  'a', 'br', 'hr', 'span', 'div',
  'blockquote', 'code', 'pre', 'sup', 'sub', 'img',
]);

const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'colspan', 'rowspan']);

function isSafeUrl(raw: string): boolean {
  const value = raw.trim().toLowerCase().replace(/\s+/g, '');
  return !value.startsWith('javascript:') && !value.startsWith('vbscript:');
}

function copyClean(source: Node, target: Element): void {
  source.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(node.textContent ?? ''));
      return;
    }
    if (!(node instanceof Element)) return; // comments / processing instructions
    const tag = node.tagName.toLowerCase();
    if (BLOCKED_TAGS.has(tag)) return; // drop subtree entirely
    if (!ALLOWED_TAGS.has(tag)) {
      copyClean(node, target); // unwrap: hoist children into the parent
      return;
    }
    const clone = document.createElement(tag);
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name)) continue;
      if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) continue;
      clone.setAttribute(attr.name, attr.value);
    }
    target.appendChild(clone);
    copyClean(node, clone);
  });
}

export function sanitizeHtml(dirty: string): string {
  const parsed = new DOMParser().parseFromString(dirty, 'text/html');
  const holder = document.createElement('div');
  copyClean(parsed.body, holder);
  return holder.innerHTML;
}
