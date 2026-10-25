import type { PresentationDeck } from './presentationTypes';
import { DECK_THEMES } from './presentationTypes';
import { slugifyFilename } from './download';

/**
 * Ekspor deck ke .pptx asli dengan PptxGenJS (MIT).
 * Dimuat dinamis agar bundel utama tetap ringan.
 */
export async function exportDeckToPptx(deck: PresentationDeck): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const theme = DECK_THEMES[deck.theme];
  const accent = theme.accent.replace('#', '');
  const background = theme.bg.replace('#', '');
  const foreground = theme.fg.replace('#', '');
  const muted = theme.muted.replace('#', '');

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Ruang Praktik KKA';
  pptx.company = 'Ruang Praktik Informatika & KKA';
  pptx.subject = 'Presentasi praktik siswa';
  pptx.title = deck.title;

  deck.slides.forEach((slide, index) => {
    const output = pptx.addSlide();
    output.background = { color: background };

    output.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.08,
      fill: { color: accent },
      line: { color: accent },
    });

    if (slide.layout === 'title') {
      output.addText(slide.title || 'Judul Presentasi', {
        x: 0.8,
        y: 2.1,
        w: 8.4,
        h: 1.5,
        align: 'center',
        fontSize: 40,
        bold: true,
        color: foreground,
        fontFace: 'Calibri',
        valign: 'middle',
      });

      if (slide.body.trim()) {
        output.addText(slide.body, {
          x: 1.2,
          y: 3.7,
          w: 7.6,
          h: 1.2,
          align: 'center',
          fontSize: 18,
          color: muted,
          fontFace: 'Calibri',
          valign: 'top',
        });
      }
    } else {
      output.addText(slide.title || 'Judul Slide', {
        x: 0.6,
        y: 0.45,
        w: 8.8,
        h: 0.9,
        fontSize: 28,
        bold: true,
        color: foreground,
        fontFace: 'Calibri',
        valign: 'middle',
      });

      output.addShape(pptx.ShapeType.rect, {
        x: 0.6,
        y: 1.42,
        w: 0.9,
        h: 0.06,
        fill: { color: accent },
        line: { color: accent },
      });

      const lines = slide.body
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0) {
        output.addText(
          lines.map((line) => ({
            text: line,
            options: { bullet: { indent: 15 }, breakLine: true },
          })),
          {
            x: 0.8,
            y: 1.7,
            w: slide.image ? 5.9 : 8.4,
            h: 4.2,
            fontSize: 18,
            color: foreground,
            fontFace: 'Calibri',
            lineSpacingMultiple: 1.25,
            valign: 'top',
          }
        );
      }

      if (slide.image) {
        output.addImage({
          data: slide.image,
          x: 6.95,
          y: 1.65,
          w: 2.55,
          h: 3.5,
          sizing: { type: 'contain', w: 2.55, h: 3.5 },
        });
      }
    }

    if (slide.image && slide.layout === 'title') {
      output.addImage({
        data: slide.image,
        x: 3.4,
        y: 4.9,
        w: 3.2,
        h: 1.6,
        sizing: { type: 'contain', w: 3.2, h: 1.6 },
      });
    }

    if (slide.notes.trim()) {
      output.addNotes(slide.notes);
    }

    output.addText(`${index + 1} / ${deck.slides.length}`, {
      x: 8.9,
      y: 5.16,
      w: 0.8,
      h: 0.3,
      fontSize: 10,
      color: muted,
      align: 'right',
      fontFace: 'Calibri',
    });
  });

  await pptx.writeFile({ fileName: `${slugifyFilename(deck.title, 'presentasi')}.pptx` });
}
