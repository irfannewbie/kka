/**
 * Ekspor dokumen contentEditable ke .docx asli menggunakan `docx` + `docx/html`.
 * Modul diimpor secara dinamis agar tidak membebani bundel utama.
 */
export async function buildDocxBlob(html: string, title: string): Promise<Blob> {
  const [{ Document, Packer }, { htmlToContent }] = await Promise.all([
    import('docx'),
    import('docx/html'),
  ]);

  const content = htmlToContent(html, { maxImageWidth: 600 });

  const document = new Document({
    creator: 'Ruang Praktik KKA',
    title,
    description: 'Dokumen dibuat di Ruang Praktik Informatika & KKA',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 24 },
          paragraph: { spacing: { line: 276, after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [...content],
      },
    ],
  });

  return Packer.toBlob(document);
}
