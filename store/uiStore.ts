import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Interface ──────────────────────────────────────────────────────────────────

export interface UIStore {
  // ── 1. Session (mock auth) ───────────────────────────────────────────────
  session: {
    userId: string;
    name: string;
    department: string;
    role: string;
    isLoggedIn: boolean;
  } | null;
  setSession(session: UIStore['session']): void;
  clearSession(): void;

  // ── 2. BatalkanControl (per-item, keyed by itemId) ──────────────────────
  // Ref: UIUX.md §9.5 BatalkanControl 3-State Machine
  // Pusher fires ONLY after the 5s Batalkan window closes (UIUX.md Hard Rule #10)
  pendingProgress: Record<
    string,
    {
      previous: number;
      timeoutRef: ReturnType<typeof setTimeout> | null;
      failedUndo: boolean;  // Amendment #8 — network failure tracking
      retryCount: number;   // Amendment #8 — retry attempts (max 5)
    }
  >;
  setPendingProgress(
    itemId: string,
    previous: number,
    timeoutRef: ReturnType<typeof setTimeout>,
  ): void;
  clearPendingProgress(itemId: string): void;
  setUndoFailed(itemId: string, failed: boolean): void;
  incrementRetryCount(itemId: string): void;

  // ── 3. Bottom Sheets ─────────────────────────────────────────────────
  // Ref: UIUX.md §9.6 QCGateSheet | §9.7 DeliveryGateSheet | §9.8 ProfileDrawer
  activeBottomSheet:
    | 'qc-gate'
    | 'delivery-gate'
    | 'issue'
    | 'split'
    | 'return'
    | 'profile'
    | null;
  bottomSheetItemId: string | null;
  openBottomSheet(
    sheet: UIStore['activeBottomSheet'],
    itemId: string,
  ): void;
  closeBottomSheet(): void;

  // ── 4. Connection Status ────────────────────────────────────────────
  // Ref: UIUX.md Offline Awareness (Manifesto §11)
  connectionStatus: 'online' | 'offline' | 'reconnecting';
  setConnectionStatus(status: UIStore['connectionStatus']): void;

  // ── 5. Board Filters ────────────────────────────────────────────────
  // Ref: UIUX.md §9.9 FilterChips (Board) — no active filters by default
  boardFilters: string[];
  setBoardFilters(filters: string[]): void;
  toggleBoardFilter(filter: string): void;

  // ── 6. My Jobs Display ──────────────────────────────────────────────
  // Ref: UIUX.md Screen 3 (/jobs) — Aktif/Arsip segments + Hari Ini filter
  showCompleted: boolean;      // controls Lihat Selesai / Arsip chip
  toggleShowCompleted(): void;
  hariIniActive: boolean;      // Hari Ini chip — active by default for workers
  toggleHariIni(): void;

  // ── 7. Local Item Progress (optimistic UI) ─────────────────────────
  // Ref: UIUX.md §9.4 ProgressSlider / StepperControl — optimistic slider state
  localProgress: Record<string, number>;
  setLocalProgress(itemId: string, value: number): void;
  clearLocalProgress(itemId: string): void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────
// Zustand v5 double-invocation pattern with immer middleware

const useUIStore = create<UIStore>()(immer((set) => ({

  // ── 1. Session ────────────────────────────────────────────────────────
  session: null,

  setSession(session) {
    set((draft) => {
      draft.session = session;
    });
  },

  clearSession() {
    set((draft) => {
      draft.session = null;
    });
  },

  // ── 2. BatalkanControl ─────────────────────────────────────────────────
  pendingProgress: {},

  setPendingProgress(itemId, previous, timeoutRef) {
    set((draft) => {
      draft.pendingProgress[itemId] = {
        previous,
        timeoutRef,
        failedUndo: false,
        retryCount: 0,
      };
    });
  },

  clearPendingProgress(itemId) {
    set((draft) => {
      delete draft.pendingProgress[itemId];
    });
  },

  setUndoFailed(itemId, failed) {
    set((draft) => {
      if (draft.pendingProgress[itemId]) {
        draft.pendingProgress[itemId].failedUndo = failed;
      }
    });
  },

  incrementRetryCount(itemId) {
    set((draft) => {
      if (draft.pendingProgress[itemId]) {
        draft.pendingProgress[itemId].retryCount += 1;
      }
    });
  },

  // ── 3. Bottom Sheets ────────────────────────────────────────────────
  activeBottomSheet: null,
  bottomSheetItemId: null,

  openBottomSheet(sheet, itemId) {
    set((draft) => {
      draft.activeBottomSheet = sheet;
      draft.bottomSheetItemId = itemId;
    });
  },

  closeBottomSheet() {
    set((draft) => {
      draft.activeBottomSheet = null;
      draft.bottomSheetItemId = null;
    });
  },

  // ── 4. Connection Status ───────────────────────────────────────────
  connectionStatus: 'online',

  setConnectionStatus(status) {
    set((draft) => {
      draft.connectionStatus = status;
    });
  },

  // ── 5. Board Filters ───────────────────────────────────────────────
  boardFilters: [],

  setBoardFilters(filters) {
    set((draft) => {
      draft.boardFilters = filters;
    });
  },

  toggleBoardFilter(filter) {
    set((draft) => {
      const idx = draft.boardFilters.indexOf(filter);
      if (idx === -1) {
        draft.boardFilters.push(filter);
      } else {
        draft.boardFilters.splice(idx, 1);
      }
    });
  },

  // ── 6. My Jobs Display ─────────────────────────────────────────────
  showCompleted: false,

  toggleShowCompleted() {
    set((draft) => {
      draft.showCompleted = !draft.showCompleted;
    });
  },

  hariIniActive: true,

  toggleHariIni() {
    set((draft) => {
      draft.hariIniActive = !draft.hariIniActive;
    });
  },

  // ── 7. Local Item Progress ───────────────────────────────────────────
  localProgress: {},

  setLocalProgress(itemId, value) {
    set((draft) => {
      draft.localProgress[itemId] = value;
    });
  },

  clearLocalProgress(itemId) {
    set((draft) => {
      delete draft.localProgress[itemId];
    });
  },

})));

export default useUIStore;
