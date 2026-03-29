import { create } from 'zustand';
import type { StatsRange } from '../types';

interface AdminUiState {
  statsRange: StatsRange;
  setStatsRange: (range: StatsRange) => void;
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  statsRange: 'day',
  setStatsRange: (range) => set({ statsRange: range }),
}));
