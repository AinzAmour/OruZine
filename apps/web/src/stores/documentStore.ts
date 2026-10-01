import type { Margins, PaperSize } from '@oruzine/formats';
import { create } from 'zustand';
import { db } from './db';

export type ObjectType = 'image' | 'text' | 'shape';

export interface BaseZineObject {
  id: string;
  type: ObjectType;
  xPercent: number; // 0..1 relative to page width
  yPercent: number; // 0..1 relative to page height
  wPercent: number; // 0..1 relative to page width
  hPercent: number; // 0..1 relative to page height
  rotation: number; // degrees
  opacity: number;
  locked: boolean;
  hidden: boolean;
}

export interface ImageObject extends BaseZineObject {
  type: 'image';
  imageDataUrl: string | null;
  imageFit: 'cover' | 'contain';
}

export interface TextObject extends BaseZineObject {
  type: 'text';
  text: string;
  fontSizePt: number;
  color: string;
  bold: boolean;
}

export interface ShapeObject extends BaseZineObject {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'line';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export type ZineObject = ImageObject | TextObject | ShapeObject;

export interface DocumentPage {
  pageNumber: number; // 1-indexed in reader order
  backgroundColor: string;
  objects: ZineObject[];
}

export interface DocumentSnapshot {
  title: string;
  formatId: string;
  paper: PaperSize;
  margins: Margins;
  bleedMm: number;
  rtl: boolean;
  pages: DocumentPage[];
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
  selectedObjectId: string | null;
  isAutosaved: boolean;
  lastSavedAt: string | null;

  // Undo / Redo
  historyPast: DocumentSnapshot[];
  historyFuture: DocumentSnapshot[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;

  // Document actions
  setTitle: (title: string) => void;
  setPaper: (paper: PaperSize) => void;
  setMargins: (margins: Margins) => void;
  setBleedMm: (bleedMm: number) => void;
  setRtl: (rtl: boolean) => void;
  setActivePageIndex: (index: number) => void;
  setSelectedObjectId: (id: string | null) => void;

  // Object manipulations
  addObject: (pageIndex: number, obj: ZineObject) => void;
  updateObject: (pageIndex: number, id: string, updates: Partial<ZineObject>) => void;
  removeObject: (pageIndex: number, id: string) => void;
  duplicateObject: (pageIndex: number, id: string) => void;

  // Layers
  bringForward: (pageIndex: number, id: string) => void;
  sendBackward: (pageIndex: number, id: string) => void;
  bringToFront: (pageIndex: number, id: string) => void;
  sendToBack: (pageIndex: number, id: string) => void;
  toggleObjectLock: (pageIndex: number, id: string) => void;
  toggleObjectVisibility: (pageIndex: number, id: string) => void;

  // Page reordering
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // Persistence
  resetDocument: () => void;
  loadDocument: (doc: Partial<ZineDocumentState>) => void;
  triggerAutosave: () => Promise<void>;
  checkSavedSession: () => Promise<boolean>;
  restoreSavedSession: () => Promise<boolean>;
}

const createDefaultPages = (): DocumentPage[] => {
  return Array.from({ length: 8 }, (_, i) => {
    const isCover = i === 0;
    const isBack = i === 7;

    const defaultText: TextObject = {
      id: `text-${i + 1}-title`,
      type: 'text',
      text: isCover ? 'MY ZINE TITLE' : isBack ? 'Created with OruZine' : `Page ${i + 1}`,
      xPercent: 0.1,
      yPercent: isCover ? 0.72 : 0.85,
      wPercent: 0.8,
      hPercent: 0.15,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fontSizePt: isCover ? 18 : 11,
      color: '#121212',
      bold: isCover,
    };

    return {
      pageNumber: i + 1,
      backgroundColor: '#ffffff',
      objects: [defaultText],
    };
  });
};

const MAX_HISTORY_STEPS = 100;
let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useDocumentStore = create<ZineDocumentState>((set, get) => ({
  version: 2,
  title: 'Untitled Zine',
  formatId: 'mini-8',
  paper: 'letter',
  margins: { top: 5, right: 5, bottom: 5, left: 5 },
  bleedMm: 3,
  rtl: false,
  pages: createDefaultPages(),
  activePageIndex: 0,
  selectedObjectId: null,
  isAutosaved: true,
  lastSavedAt: null,

  historyPast: [],
  historyFuture: [],

  pushHistory: () => {
    const state = get();
    const snapshot: DocumentSnapshot = {
      title: state.title,
      formatId: state.formatId,
      paper: state.paper,
      margins: state.margins,
      bleedMm: state.bleedMm,
      rtl: state.rtl,
      pages: JSON.parse(JSON.stringify(state.pages)),
    };

    set((s) => ({
      historyPast: [...s.historyPast.slice(-MAX_HISTORY_STEPS + 1), snapshot],
      historyFuture: [],
    }));
  },

  canUndo: () => get().historyPast.length > 0,
  canRedo: () => get().historyFuture.length > 0,

  undo: () => {
    const { historyPast, historyFuture } = get();
    if (historyPast.length === 0) return;

    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);

    const currentSnapshot: DocumentSnapshot = {
      title: get().title,
      formatId: get().formatId,
      paper: get().paper,
      margins: get().margins,
      bleedMm: get().bleedMm,
      rtl: get().rtl,
      pages: JSON.parse(JSON.stringify(get().pages)),
    };

    set({
      ...previous,
      historyPast: newPast,
      historyFuture: [currentSnapshot, ...historyFuture],
      selectedObjectId: null,
    });
    get().triggerAutosave();
  },

  redo: () => {
    const { historyPast, historyFuture } = get();
    if (historyFuture.length === 0) return;

    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);

    const currentSnapshot: DocumentSnapshot = {
      title: get().title,
      formatId: get().formatId,
      paper: get().paper,
      margins: get().margins,
      bleedMm: get().bleedMm,
      rtl: get().rtl,
      pages: JSON.parse(JSON.stringify(get().pages)),
    };

    set({
      ...next,
      historyPast: [...historyPast, currentSnapshot],
      historyFuture: newFuture,
      selectedObjectId: null,
    });
    get().triggerAutosave();
  },

  setTitle: (title) => {
    get().pushHistory();
    set({ title });
    get().triggerAutosave();
  },

  setPaper: (paper) => {
    get().pushHistory();
    set({ paper });
    get().triggerAutosave();
  },

  setMargins: (margins) => {
    get().pushHistory();
    set({ margins });
    get().triggerAutosave();
  },

  setBleedMm: (bleedMm) => {
    get().pushHistory();
    set({ bleedMm });
    get().triggerAutosave();
  },

  setRtl: (rtl) => {
    get().pushHistory();
    set({ rtl });
    get().triggerAutosave();
  },

  setActivePageIndex: (index) => {
    set({ activePageIndex: index, selectedObjectId: null });
  },

  setSelectedObjectId: (id) => {
    set({ selectedObjectId: id });
  },

  addObject: (pageIndex, obj) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      nextPages[pageIndex] = {
        ...page,
        objects: [...page.objects, obj],
      };
      return { pages: nextPages, selectedObjectId: obj.id };
    });
    get().triggerAutosave();
  },

  updateObject: (pageIndex, id, updates) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      nextPages[pageIndex] = {
        ...page,
        objects: page.objects.map((o) => (o.id === id ? ({ ...o, ...updates } as ZineObject) : o)),
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  removeObject: (pageIndex, id) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      nextPages[pageIndex] = {
        ...page,
        objects: page.objects.filter((o) => o.id !== id),
      };
      return { pages: nextPages, selectedObjectId: null };
    });
    get().triggerAutosave();
  },

  duplicateObject: (pageIndex, id) => {
    const page = get().pages[pageIndex];
    const source = page?.objects.find((o) => o.id === id);
    if (!source) return;

    get().pushHistory();
    const cloned: ZineObject = {
      ...JSON.parse(JSON.stringify(source)),
      id: `${source.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      xPercent: Math.min(0.8, source.xPercent + 0.05),
      yPercent: Math.min(0.8, source.yPercent + 0.05),
    };

    get().addObject(pageIndex, cloned);
  },

  bringForward: (pageIndex, id) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      const idx = page.objects.findIndex((o) => o.id === id);
      if (idx === -1 || idx === page.objects.length - 1) return state;

      const objects = [...page.objects];
      const [item] = objects.splice(idx, 1);
      objects.splice(idx + 1, 0, item);

      nextPages[pageIndex] = { ...page, objects };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  sendBackward: (pageIndex, id) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      const idx = page.objects.findIndex((o) => o.id === id);
      if (idx <= 0) return state;

      const objects = [...page.objects];
      const [item] = objects.splice(idx, 1);
      objects.splice(idx - 1, 0, item);

      nextPages[pageIndex] = { ...page, objects };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  bringToFront: (pageIndex, id) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      const idx = page.objects.findIndex((o) => o.id === id);
      if (idx === -1 || idx === page.objects.length - 1) return state;

      const objects = [...page.objects];
      const [item] = objects.splice(idx, 1);
      objects.push(item);

      nextPages[pageIndex] = { ...page, objects };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  sendToBack: (pageIndex, id) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      const idx = page.objects.findIndex((o) => o.id === id);
      if (idx <= 0) return state;

      const objects = [...page.objects];
      const [item] = objects.splice(idx, 1);
      objects.unshift(item);

      nextPages[pageIndex] = { ...page, objects };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  toggleObjectLock: (pageIndex, id) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      nextPages[pageIndex] = {
        ...page,
        objects: page.objects.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o)),
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  toggleObjectVisibility: (pageIndex, id) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = nextPages[pageIndex];
      nextPages[pageIndex] = {
        ...page,
        objects: page.objects.map((o) => (o.id === id ? { ...o, hidden: !o.hidden } : o)),
      };
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  reorderPages: (fromIndex, toIndex) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const [moved] = nextPages.splice(fromIndex, 1);
      nextPages.splice(toIndex, 0, moved);

      const renumbered = nextPages.map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
      }));

      return { pages: renumbered, activePageIndex: toIndex, selectedObjectId: null };
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
      selectedObjectId: null,
      isAutosaved: true,
      lastSavedAt: null,
      historyPast: [],
      historyFuture: [],
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
      selectedObjectId: null,
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
