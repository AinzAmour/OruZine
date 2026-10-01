import {
  createFilterInstance,
  createOverlayInstance,
  type FilterInstance,
  type FilterType,
  getLookById,
  type OverlayInstance,
  type OverlayType,
} from '@oruzine/filters';
import type { Margins, PaperSize } from '@oruzine/formats';
import { create } from 'zustand';
import { db } from './db';

export type ObjectType = 'image' | 'text' | 'shape' | 'sticker';

export type ImageMask = 'none' | 'circle' | 'star' | 'torn-edge' | 'stamp';

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
  mask?: ImageMask;
  paperShadow?: boolean;
  filters?: FilterInstance[];
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

export type StickerType =
  | 'tape-masking'
  | 'tape-duct'
  | 'tape-clear'
  | 'staple'
  | 'pushpin'
  | 'arrow'
  | 'star'
  | 'barcode'
  | 'halftone-dot';

export interface StickerObject extends BaseZineObject {
  type: 'sticker';
  stickerType: StickerType;
  color?: string;
}

export type ZineObject = ImageObject | TextObject | ShapeObject | StickerObject;

export interface DocumentPage {
  pageNumber: number; // 1-indexed in reader order
  backgroundColor: string;
  objects: ZineObject[];
  pageFilters?: FilterInstance[];
  pageOverlays?: OverlayInstance[];
}

export interface DocumentSnapshot {
  title: string;
  formatId: string;
  paper: PaperSize;
  margins: Margins;
  bleedMm: number;
  creepMm?: number;
  rtl: boolean;
  pages: DocumentPage[];
  activeLookId?: string | null;
}

export interface ZineDocumentState {
  version: number;
  title: string;
  formatId: string;
  paper: PaperSize;
  margins: Margins;
  bleedMm: number;
  creepMm: number;
  rtl: boolean;
  pages: DocumentPage[];
  activePageIndex: number; // 0-indexed
  selectedObjectId: string | null;
  activeLookId: string | null;
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
  setFormat: (formatId: string, pageCount?: number) => void;
  setPageCount: (count: number) => void;
  setPaper: (paper: PaperSize) => void;
  setMargins: (margins: Margins) => void;
  setBleedMm: (bleedMm: number) => void;
  setCreepMm: (creepMm: number) => void;
  setRtl: (rtl: boolean) => void;
  setActivePageIndex: (index: number) => void;
  setSelectedObjectId: (id: string | null) => void;

  // Object manipulations
  addObject: (pageIndex: number, obj: ZineObject) => void;
  addSticker: (pageIndex: number, stickerType: StickerType, color?: string) => void;
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

  // Filter Stacks
  addFilter: (pageIndex: number, objectId: string | null, type: FilterType) => void;
  updateFilter: (
    pageIndex: number,
    objectId: string | null,
    filterId: string,
    params: Record<string, unknown>,
  ) => void;
  removeFilter: (pageIndex: number, objectId: string | null, filterId: string) => void;
  toggleFilter: (pageIndex: number, objectId: string | null, filterId: string) => void;
  applyFiltersToAllPages: (filters: FilterInstance[]) => void;

  // Signature Looks & Overlays
  applyLook: (lookId: string) => void;
  clearLook: () => void;
  addOverlay: (pageIndex: number, type: OverlayType) => void;
  updateOverlay: (pageIndex: number, overlayId: string, updates: Partial<OverlayInstance>) => void;
  removeOverlay: (pageIndex: number, overlayId: string) => void;
  applyOverlaysToAllPages: (overlays: OverlayInstance[]) => void;

  // Persistence
  resetDocument: () => void;
  loadDocument: (doc: Partial<ZineDocumentState>) => void;
  triggerAutosave: () => Promise<void>;
  checkSavedSession: () => Promise<boolean>;
  restoreSavedSession: () => Promise<boolean>;
}

const createDefaultPages = (count = 8): DocumentPage[] => {
  return Array.from({ length: count }, (_, i) => {
    const isCover = i === 0;
    const isBack = i === count - 1;

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
  creepMm: 0,
  rtl: false,
  pages: createDefaultPages(8),
  activePageIndex: 0,
  selectedObjectId: null,
  activeLookId: null,
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
      creepMm: state.creepMm,
      rtl: state.rtl,
      pages: JSON.parse(JSON.stringify(state.pages)),
      activeLookId: state.activeLookId,
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
      creepMm: get().creepMm,
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
      creepMm: get().creepMm,
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

  setFormat: (formatId, requestedCount) => {
    get().pushHistory();
    const currentPages = get().pages;
    const count =
      requestedCount ??
      (formatId === 'mini-8' ? 8 : Math.max(4, Math.ceil(currentPages.length / 4) * 4));
    let newPages: DocumentPage[];
    if (count > currentPages.length) {
      const extra = createDefaultPages(count).slice(currentPages.length);
      newPages = [...currentPages, ...extra];
    } else {
      newPages = currentPages.slice(0, count);
    }
    newPages = newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    const newActiveIndex = Math.min(get().activePageIndex, newPages.length - 1);
    set({
      formatId,
      pages: newPages,
      activePageIndex: newActiveIndex,
      selectedObjectId: null,
    });
    get().triggerAutosave();
  },

  setPageCount: (count) => {
    get().pushHistory();
    const currentPages = get().pages;
    let newPages: DocumentPage[];
    if (count > currentPages.length) {
      const extra = createDefaultPages(count).slice(currentPages.length);
      newPages = [...currentPages, ...extra];
    } else {
      newPages = currentPages.slice(0, count);
    }
    newPages = newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    const newActiveIndex = Math.min(get().activePageIndex, newPages.length - 1);
    set({
      pages: newPages,
      activePageIndex: newActiveIndex,
      selectedObjectId: null,
    });
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

  setCreepMm: (creepMm) => {
    get().pushHistory();
    set({ creepMm });
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

  addSticker: (pageIndex, stickerType, color) => {
    const isTape = stickerType.startsWith('tape-');
    const isSmall = stickerType === 'staple' || stickerType === 'pushpin';
    const stickerObj: StickerObject = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'sticker',
      stickerType,
      xPercent: 0.35,
      yPercent: 0.35,
      wPercent: isTape ? 0.35 : isSmall ? 0.12 : 0.22,
      hPercent: isTape ? 0.08 : isSmall ? 0.06 : 0.18,
      rotation: isTape ? (Math.random() > 0.5 ? 4 : -4) : 0,
      opacity: stickerType === 'tape-clear' ? 0.6 : 0.95,
      locked: false,
      hidden: false,
      color,
    };
    get().addObject(pageIndex, stickerObj);
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

  addFilter: (pageIndex, objectId, type) => {
    get().pushHistory();
    const newFilter = createFilterInstance(type);
    set((state) => {
      const nextPages = [...state.pages];
      const page = { ...nextPages[pageIndex] };
      if (!page) return state;

      if (objectId) {
        page.objects = page.objects.map((obj) => {
          if (obj.id === objectId && obj.type === 'image') {
            return {
              ...obj,
              filters: [...(obj.filters || []), newFilter],
            };
          }
          return obj;
        });
      } else {
        page.pageFilters = [...(page.pageFilters || []), newFilter];
      }

      nextPages[pageIndex] = page;
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  updateFilter: (pageIndex, objectId, filterId, params) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = { ...nextPages[pageIndex] };
      if (!page) return state;

      if (objectId) {
        page.objects = page.objects.map((obj) => {
          if (obj.id === objectId && obj.type === 'image' && obj.filters) {
            return {
              ...obj,
              filters: obj.filters.map((f) =>
                f.id === filterId ? { ...f, params: { ...f.params, ...params } } : f,
              ),
            };
          }
          return obj;
        });
      } else if (page.pageFilters) {
        page.pageFilters = page.pageFilters.map((f) =>
          f.id === filterId ? { ...f, params: { ...f.params, ...params } } : f,
        );
      }

      nextPages[pageIndex] = page;
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  removeFilter: (pageIndex, objectId, filterId) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = { ...nextPages[pageIndex] };
      if (!page) return state;

      if (objectId) {
        page.objects = page.objects.map((obj) => {
          if (obj.id === objectId && obj.type === 'image' && obj.filters) {
            return {
              ...obj,
              filters: obj.filters.filter((f) => f.id !== filterId),
            };
          }
          return obj;
        });
      } else if (page.pageFilters) {
        page.pageFilters = page.pageFilters.filter((f) => f.id !== filterId);
      }

      nextPages[pageIndex] = page;
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  toggleFilter: (pageIndex, objectId, filterId) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = { ...nextPages[pageIndex] };
      if (!page) return state;

      if (objectId) {
        page.objects = page.objects.map((obj) => {
          if (obj.id === objectId && obj.type === 'image' && obj.filters) {
            return {
              ...obj,
              filters: obj.filters.map((f) =>
                f.id === filterId ? { ...f, enabled: !f.enabled } : f,
              ),
            };
          }
          return obj;
        });
      } else if (page.pageFilters) {
        page.pageFilters = page.pageFilters.map((f) =>
          f.id === filterId ? { ...f, enabled: !f.enabled } : f,
        );
      }

      nextPages[pageIndex] = page;
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  applyFiltersToAllPages: (filters) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) => ({
        ...p,
        pageFilters: filters.map((f) => ({
          ...f,
          id: `filt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      })),
    }));
    get().triggerAutosave();
  },

  applyLook: (lookId) => {
    const look = getLookById(lookId);
    if (!look) return;
    get().pushHistory();

    set((state) => ({
      activeLookId: lookId,
      pages: state.pages.map((p) => {
        const newFilters = look.filters.map((f) => ({
          ...f,
          id: `filt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        }));
        const newOverlays = look.overlays.map((o) => ({
          ...o,
          id: `ovl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        }));

        const updatedObjects = p.objects.map((obj) => {
          if (obj.type === 'text') {
            return { ...obj, color: look.textColor };
          }
          return obj;
        });

        return {
          ...p,
          backgroundColor: look.paperColor,
          pageFilters: newFilters,
          pageOverlays: newOverlays,
          objects: updatedObjects,
        };
      }),
    }));
    get().triggerAutosave();
  },

  clearLook: () => {
    get().pushHistory();
    set((state) => ({
      activeLookId: null,
      pages: state.pages.map((p) => ({
        ...p,
        pageFilters: [],
        pageOverlays: [],
      })),
    }));
    get().triggerAutosave();
  },

  addOverlay: (pageIndex, type) => {
    get().pushHistory();
    const newOverlay = createOverlayInstance(type);
    set((state) => {
      const nextPages = [...state.pages];
      const page = { ...nextPages[pageIndex] };
      if (!page) return state;

      page.pageOverlays = [...(page.pageOverlays || []), newOverlay];
      nextPages[pageIndex] = page;
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  updateOverlay: (pageIndex, overlayId, updates) => {
    set((state) => {
      const nextPages = [...state.pages];
      const page = { ...nextPages[pageIndex] };
      if (!page?.pageOverlays) return state;

      page.pageOverlays = page.pageOverlays.map((o) =>
        o.id === overlayId ? { ...o, ...updates } : o,
      );
      nextPages[pageIndex] = page;
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  removeOverlay: (pageIndex, overlayId) => {
    get().pushHistory();
    set((state) => {
      const nextPages = [...state.pages];
      const page = { ...nextPages[pageIndex] };
      if (!page?.pageOverlays) return state;

      page.pageOverlays = page.pageOverlays.filter((o) => o.id !== overlayId);
      nextPages[pageIndex] = page;
      return { pages: nextPages };
    });
    get().triggerAutosave();
  },

  applyOverlaysToAllPages: (overlays) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) => ({
        ...p,
        pageOverlays: overlays.map((o) => ({
          ...o,
          id: `ovl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      })),
    }));
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
