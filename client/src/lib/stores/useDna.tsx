import { create } from "zustand";

interface DnaState {
  dna: number;
  setDna: (dna: number) => void;
}

export const useDna = create<DnaState>((set) => ({
  dna: 0,
  setDna: (dna) => set({ dna }),
}));