const BASE = '/api';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

import type { Play, Character, Relation, Theme, NarrativeStage } from '../types';

export const api = {
  plays: {
    list: (params?: { genre?: string; era?: string }) => {
      const qs = new URLSearchParams();
      if (params?.genre) qs.set('genre', params.genre);
      if (params?.era) qs.set('era', params.era);
      const q = qs.toString();
      return fetchJson<Play[]>(`/plays${q ? `?${q}` : ''}`);
    },
    byId: (id: string) => fetchJson<Play>(`/plays/${id}`),
  },
  characters: (playId: string) => fetchJson<Character[]>(`/plays/${playId}/characters`),
  relations: (playId: string) => fetchJson<Relation[]>(`/plays/${playId}/relations`),
  themes: (playId: string) => fetchJson<Theme[]>(`/plays/${playId}/themes`),
  narrative: (playId: string) => fetchJson<NarrativeStage[]>(`/plays/${playId}/narrative`),
  analyzeStatus: (playId: string) => fetchJson<{ id: number; status: string; progress: number }>(`/analyze/${playId}/status`),
  stats: {
    roleTypes: () => fetchJson<any>('/stats/role-types'),
    themes: () => fetchJson<any>('/stats/themes'),
  },
};
