import { create } from "zustand";

interface SunsState {
  suns: number;
  setSuns: (suns: number) => void;
}

export const useSuns = create<SunsState>((set) => ({
  suns: 100,
  setSuns: (suns) => set({ suns }),
}));