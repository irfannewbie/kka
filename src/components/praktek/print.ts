/** Cetak HTML (PDF via dialog print) tanpa meninggalkan halaman aplikasi. */

export function printHtmlDocument(html: string): boolean {
  if (typeof document === 'undefined') return false;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'Pratinjau cetak';
  frame.style.cssText =
    'position:fixed;left:-10000px;top:0;width:900px;height:1200px;border:0;background:#fff;';

  document.body.appendChild(frame);

  const frameDocument = frame.contentDocument;
  if (!frameDocument) {
    frame.remove();
    return false;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  const trigger = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => frame.remove(), 60_000);
    }
  };

  frame.contentWindow?.addEventListener('afterprint', () => frame.remove(), { once: true });
  window.setTimeout(trigger, 400);

  return true;
}
