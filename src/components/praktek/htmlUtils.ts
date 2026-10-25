/** Pembersih HTML untuk konten contentEditable sebelum disimpan/diekspor. */

const DANGEROUS_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
];

/**
 * Menghapus elemen/atribut berbahaya dari HTML tempelan (paste) atau impor.
 * Teks, tabel, dan tautan biasa dipertahankan; gambar hanya dipertahankan jika
 * berupa data URL lokal (gambar dari internet dibuang agar ekspor tetap aman).
 */
export function sanitizeEditorHtml(html: string): string {
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return html;

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll(DANGEROUS_TAGS.join(',')).forEach((element) => element.remove());

  const elements: Element[] = [];
  const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    if (walker.currentNode instanceof Element) elements.push(walker.currentNode);
  }

  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (
        (name === 'href' || name === 'src' || name === 'xlink:href') &&
        value.startsWith('javascript:')
      ) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element.tagName === 'A') {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }

    if (element.tagName === 'IMG') {
      const source = element.getAttribute('src') ?? '';
      if (!source.startsWith('data:image/')) {
        element.remove();
        continue;
      }
      element.setAttribute('style', 'max-width:100%;height:auto;');
    }
  }

  return parsed.body.innerHTML;
}

export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  return (container.textContent || container.innerText || '').replace(/\u00a0/g, ' ');
}

export function countWords(html: string): number {
  const text = htmlToPlainText(html).trim();
  return text ? text.split(/\s+/).length : 0;
}
