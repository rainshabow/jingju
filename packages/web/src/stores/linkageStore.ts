import { create } from 'zustand';
import type { Character, Relation, Theme, NarrativeStage } from 'shared/types';

interface PlayCache {
  characters: Character[];
  relations: Relation[];
  themes: Theme[];
  narrative: NarrativeStage[];
}

interface LinkageState {
  viewMode: 'single' | 'cross';
  selectedPlayId: string;
  highlightedCharName: string | null;
  highlightedTheme: string | null;
  detailOpen: boolean;
  filters: { genre?: string; era?: string };
  /** Cache of play detail data, keyed by playId */
  dataCache: Record<string, PlayCache>;
  setMode: (mode: 'single' | 'cross') => void;
  selectPlay: (id: string) => void;
  highlightChar: (name: string | null, openDrawer?: boolean) => void;
  highlightTheme: (name: string | null) => void;
  toggleDetail: (open?: boolean) => void;
  setFilters: (filters: { genre?: string; era?: string }) => void;
  cachePlayData: (id: string, data: PlayCache) => void;
}

export const useLinkageStore = create<LinkageState>((set) => ({
  viewMode: 'single',
  selectedPlayId: '1',
  highlightedCharName: null,
  highlightedTheme: null,
  detailOpen: false,
  filters: {},
  dataCache: {},
  setMode: (mode) => set({ viewMode: mode }),
  selectPlay: (id) => set({ selectedPlayId: id }),
  highlightChar: (name, openDrawer?) =>
    set((s) => ({
      highlightedCharName: name,
      detailOpen: openDrawer !== undefined ? openDrawer : name !== null,
    })),
  highlightTheme: (name) => set({ highlightedTheme: name }),
  toggleDetail: (open) => set((s) => ({ detailOpen: open !== undefined ? open : !s.detailOpen })),
  setFilters: (filters) => set({ filters }),
  cachePlayData: (id, data) =>
    set((s) => ({ dataCache: { ...s.dataCache, [id]: data } })),
}));
