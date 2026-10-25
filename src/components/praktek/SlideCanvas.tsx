import React from 'react';
import type { DeckTheme, PresentationSlide } from './presentationTypes';

interface SlideCanvasProps {
  slide: PresentationSlide;
  theme: DeckTheme;
  index: number;
  total: number;
  className?: string;
}

/** Pratinjau slide 16:9 yang skalanya mengikuti lebar wadah (container query). */
export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  theme,
  index,
  total,
  className = '',
}) => {
  const lines = slide.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden ${className}`}
      style={{ backgroundColor: theme.bg, color: theme.fg, containerType: 'inline-size' }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[0.9cqw]"
        style={{ backgroundColor: theme.accent }}
      />

      {slide.layout === 'title' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-[8cqw] text-center">
          <div className="font-black leading-[1.08] text-[8.2cqw] break-words max-w-full">
            {slide.title || 'Judul Presentasi'}
          </div>
          {slide.body.trim() && (
            <div className="mt-[3cqw] text-[3.4cqw] leading-snug opacity-80 whitespace-pre-line break-words max-w-full">
              {slide.body}
            </div>
          )}
          {slide.image && (
            <img
              src={slide.image}
              alt=""
              className="mt-[3cqw] max-h-[25cqw] max-w-[70%] object-contain"
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col px-[7cqw] py-[6.5cqw]">
          <div
            className="font-black leading-tight text-[5.4cqw] border-l-[1.1cqw] pl-[2.4cqw] break-words"
            style={{ borderColor: theme.accent }}
          >
            {slide.title || 'Judul Slide'}
          </div>

          <div className="mt-[3.2cqw] flex min-h-0 flex-1 gap-[3cqw]">
            <div className="flex-1 space-y-[1.7cqw]">
              {lines.length > 0 ? (
                lines.map((line, lineIndex) => (
                  <div key={`${lineIndex}-${line.slice(0, 12)}`} className="flex items-start gap-[1.5cqw]">
                    <span
                      className="mt-[1.45cqw] h-[0.9cqw] w-[0.9cqw] shrink-0 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <span className="text-[3.3cqw] leading-snug break-words">{line}</span>
                  </div>
                ))
              ) : (
                <span className="text-[3.3cqw] opacity-50">Tambahkan poin di panel editor…</span>
              )}
            </div>

            {slide.image && (
              <img
                src={slide.image}
                alt=""
                className="max-h-full w-[30%] shrink-0 self-center object-contain"
              />
            )}
          </div>
        </div>
      )}

      <div
        className="absolute bottom-[2.2cqw] right-[3cqw] text-[1.7cqw]"
        style={{ color: theme.muted }}
      >
        {index + 1} / {total}
      </div>
    </div>
  );
};
