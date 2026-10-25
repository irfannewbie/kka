/** Tipe & penyimpanan lokal untuk Lab Presentasi. */

export type SlideLayout = 'title' | 'content';

export type DeckThemeId = 'paper' | 'midnight' | 'forest' | 'sunset' | 'ocean';

export interface PresentationSlide {
  id: string;
  layout: SlideLayout;
  title: string;
  body: string;
  notes: string;
  image?: string;
}

export interface PresentationDeck {
  title: string;
  theme: DeckThemeId;
  slides: PresentationSlide[];
  updatedAt: number;
}

export interface DeckTheme {
  id: DeckThemeId;
  name: string;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
}

export const DECK_STORAGE_KEY = 'praktek_deck_v1';

export const DECK_THEMES: Record<DeckThemeId, DeckTheme> = {
  paper: {
    id: 'paper',
    name: 'Kertas',
    bg: '#FAF8F5',
    fg: '#1a1a1a',
    muted: '#64748b',
    accent: '#2e59e6',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    bg: '#0f172a',
    fg: '#f8fafc',
    muted: '#94a3b8',
    accent: '#38bdf8',
  },
  forest: {
    id: 'forest',
    name: 'Hutan',
    bg: '#052e16',
    fg: '#ecfdf5',
    muted: '#86efac',
    accent: '#4ade80',
  },
  sunset: {
    id: 'sunset',
    name: 'Senja',
    bg: '#431407',
    fg: '#fff7ed',
    muted: '#fdba74',
    accent: '#fb923c',
  },
  ocean: {
    id: 'ocean',
    name: 'Samudra',
    bg: '#082f49',
    fg: '#f0f9ff',
    muted: '#7dd3fc',
    accent: '#22d3ee',
  },
};

export function createSlideId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSlide(
  layout: SlideLayout,
  title: string,
  body: string,
  notes = ''
): PresentationSlide {
  return { id: createSlideId(), layout, title, body, notes };
}

export function createDefaultDeck(): PresentationDeck {
  return {
    title: 'Presentasi Baru',
    theme: 'paper',
    slides: [
      createSlide(
        'title',
        'Judul Presentasi',
        'Nama • Kelas • Mata Pelajaran',
        'Perkenalkan topik dan dirimu pada slide pertama.'
      ),
      createSlide(
        'content',
        'Poin Utama',
        'Poin pertama yang ingin disampaikan\nPoin kedua dengan contoh\nPoin ketiga sebagai penegasan',
        'Jelaskan satu poin per kalimat. Catatan pembicara tidak tampil di slide.'
      ),
      createSlide(
        'content',
        'Kesimpulan',
        'Ringkas 2–3 hal penting\nTutup dengan ajakan atau pertanyaan',
        'Ucapkan terima kasih dan buka sesi tanya jawab.'
      ),
    ],
    updatedAt: Date.now(),
  };
}

const THEME_IDS = Object.keys(DECK_THEMES) as DeckThemeId[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSlide(raw: unknown): PresentationSlide | null {
  if (!isRecord(raw)) return null;

  const layout: SlideLayout = raw.layout === 'title' ? 'title' : 'content';

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createSlideId(),
    layout,
    title: typeof raw.title === 'string' ? raw.title : '',
    body: typeof raw.body === 'string' ? raw.body : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    image: typeof raw.image === 'string' && raw.image ? raw.image : undefined,
  };
}

export function loadDeck(): PresentationDeck {
  if (typeof window === 'undefined') return createDefaultDeck();

  try {
    const raw = window.localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) return createDefaultDeck();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return createDefaultDeck();

    const theme =
      typeof parsed.theme === 'string' && THEME_IDS.includes(parsed.theme as DeckThemeId)
        ? (parsed.theme as DeckThemeId)
        : 'paper';

    const slides = Array.isArray(parsed.slides)
      ? parsed.slides.map(normalizeSlide).filter((slide): slide is PresentationSlide => slide !== null)
      : [];

    if (slides.length === 0) return createDefaultDeck();

    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : 'Presentasi Baru',
      theme,
      slides,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return createDefaultDeck();
  }
}

export function saveDeck(deck: PresentationDeck): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    DECK_STORAGE_KEY,
    JSON.stringify({ ...deck, updatedAt: Date.now() })
  );
}
