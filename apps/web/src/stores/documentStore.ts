import type { Margins, PaperSize } from '@oruzine/formats';
import { create } from 'zustand';
import { db } from './db';

export interface TextBox {
  id: string;
  text: string;
  xPercent: number; // 0..1 relative to page width
  yPercent: number; // 0..1 relative to page height
  fontSizePt: number;
  color: string;
  bold?: boolean;
}

export interface DocumentPage {
  pageNumber: number; // 1-indexed in reader order
  imageDataUrl?: string | null;
  imageFit: 'cover' | 'contain';
  textBoxes: TextBox[];
}

export interface ZineDocumentState {
  version: number;
  title: string;
  formatId: string;
  paper: PaperSize;
  margins: Margins;
  bleedMm: number;
  rtl: boolean;
  pages: DocumentPage[];
  activePageIndex: number; // 0-indexed (0..7)
  isAutosaved: boolean;
  lastSavedAt: string | null;

  // Actions
  setTitle: (title: string) => void;
  setPaper: (paper: PaperSize) => void;
  setMargins: (margins: Margins) => void;
  setBleedMm: (bleedMm: number) => void;
  setRtl: (rtl: boolean) => void;
  setActivePageIndex: (index: number) => void;

  // Page Editing
  setPageImage: (pageIndex: number, dataUrl: string, fit?: 'cover' | 'contain') => void;
  clearPageImage: (pageIndex: number) => void;
  setPageImageFit: (pageIndex: number, fit: 'cover' | 'contain') => void;

  // Text Boxes
  addTextBox: (pageIndex: number, text?: string) => void;
  updateTextBox: (pageIndex: number, id: string, updates: Partial<TextBox>) => void;
  removeTextBox: (pageIndex: number, id: string) => void;

  // Reorder
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // Persistence
  resetDocument: () => void;
  loadDocument: (doc: Partial<ZineDocumentState>) => void;
  triggerAutosave: () => Promise<void>;
  checkSavedSession: () => Promise<boolean>;
  restoreSavedSession: () => Promise<boolean>;
}

const createDefaultPages = (): DocumentPage[] => {
  return Array.from({ length: 8 }, (_, i) => ({
    pageNumber: i + 1,
    imageDataUrl: null,
    imageFit: 'cover',
    textBoxes: [
      {
        id: `tb-${i + 1}-default`,
        text: i === 0 ? 'MY ZINE TITLE' : i === 7 ? 'Created with OruZine' : `Page ${i + 1}`,
        xPercent: 0.1,
        yPercent: i === 0 ? 0.75 : 0.82,
        fontSizePt: i === 0 ? 18 : 11,
        color: '#121212',
        bold: i === 0,
      },
    ],
  }));
};

let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useDocumentStore = create<ZineDocumentState>((set, get) => ({
  version: 1,
  title: 'Untitled Zine',
  formatId: 'mini-8',
  paper: 'letter',
  margins: { top: 5, right: 5, bottom: 5, left: 5 },
  bleedMm: 3,
  rtl: false,
  pages: createDefaultPages(),
  activePageIndex: 0,
  isAutosaved: true,
  lastSavedAt: null,

  setTitle: (title) => {
    set({ title });
    get().triggerAutosave();
  },

  setPaper: (paper) => {
    set({ paper });
    get().triggerAutosave();
  },

  setMargins: (margins) => {
    set({ margins });
    get().triggerAutosave();
  },

  setBleedMm: (bleedMm) => {
    set({ bleedMm });
    get().triggerAutosave();
  },

  setRtl: (rtl) => {
    set({ rtl });
    get().triggerAutosave();
  },

  setActivePageIndex: (index) => {
    set({ activePageIndex: index });
  },

  setPageImage: (pageIndex, dataUrl, fit = 'cover') => {
    set((state) => {
      const nextPages = [...state.pages];
      nextPages[pageIndex] = {
        ...nextPages[pageIndex],
        imageDataUrl: dataUrl,
        imageFit: fit,
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  clearPageImage: (pageIndex) => {
    set((state) => {
      const nextPages = [...state.pages];
      nextPages[pageIndex] = {
        ...nextPages[pageIndex],
        imageDataUrl: null,
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  setPageImageFit: (pageIndex, fit) => {
    set((state) => {
      const nextPages = [...state.pages];
      nextPages[pageIndex] = {
        ...nextPages[pageIndex],
        imageFit: fit,
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  addTextBox: (pageIndex, text = 'New Text') => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      const newBox: TextBox = {
        id: `tb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        xPercent: 0.15,
        yPercent: 0.5,
        fontSizePt: 14,
        color: '#121212',
        bold: false,
      };
      nextPages[pageIndex] = {
        ...page,
        textBoxes: [...page.textBoxes, newBox],
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  updateTextBox: (pageIndex, id, updates) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      nextPages[pageIndex] = {
        ...page,
        textBoxes: page.textBoxes.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  removeTextBox: (pageIndex, id) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      nextPages[pageIndex] = {
        ...page,
        textBoxes: page.textBoxes.filter((b) => b.id !== id),
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  reorderPages: (fromIndex, toIndex) => {
    set((state) => {
      const nextPages = [...state.pages];
      const [moved] = nextPages.splice(fromIndex, 1);
      nextPages.splice(toIndex, 0, moved);

      // Re-normalize pageNumber property
      const renumbered = nextPages.map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
      }));

      return { pages: renumbered, activePageIndex: toIndex };
    });
    get().triggerAutosave();
  },

  resetDocument: () => {
    set({
      title: 'Untitled Zine',
      paper: 'letter',
      margins: { top: 5, right: 5, bottom: 5, left: 5 },
      bleedMm: 3,
      rtl: false,
      pages: createDefaultPages(),
      activePageIndex: 0,
      isAutosaved: true,
      lastSavedAt: null,
    });
    try {
      db.documents.delete('current-session');
    } catch {
      // Ignore
    }
  },

  loadDocument: (doc) => {
    set((state) => ({
      ...state,
      ...doc,
    }));
  },

  triggerAutosave: async () => {
    set({ isAutosaved: false });
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }

    autosaveTimeout = setTimeout(async () => {
      try {
        const state = get();
        const payload = {
          version: state.version,
          title: state.title,
          formatId: state.formatId,
          paper: state.paper,
          margins: state.margins,
          bleedMm: state.bleedMm,
          rtl: state.rtl,
          pages: state.pages,
        };

        const now = new Date().toISOString();
        await db.documents.put({
          id: 'current-session',
          updatedAt: now,
          data: JSON.stringify(payload),
        });

        set({ isAutosaved: true, lastSavedAt: now });
      } catch (err) {
        console.warn('Autosave failed:', err);
      }
    }, 1200);
  },

  checkSavedSession: async () => {
    try {
      const entry = await db.documents.get('current-session');
      return !!entry;
    } catch {
      return false;
    }
  },

  restoreSavedSession: async () => {
    try {
      const entry = await db.documents.get('current-session');
      if (entry?.data) {
        const parsed = JSON.parse(entry.data);
        get().loadDocument(parsed);
        return true;
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
    return false;
  },
}));
