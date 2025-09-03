import { create } from 'zustand';

interface SunSpawn {
  id: number;
  fieldIndex: number;
  spawnedAt: string;
  expiresAt: string;
  sunAmount: number;
  isActive: boolean;
}

interface SunSpawnsStore {
  sunSpawns: SunSpawn[];
  setSunSpawns: (spawns: SunSpawn[]) => void;
  removeSunSpawn: (fieldIndex: number) => void;
  getSunSpawnOnField: (fieldIndex: number) => SunSpawn | undefined;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useSunSpawns = create<SunSpawnsStore>((set, get) => ({
  sunSpawns: [],
  isLoading: false,
  
  setSunSpawns: (spawns) => set({ sunSpawns: spawns }),
  
  removeSunSpawn: (fieldIndex) => set((state) => ({
    sunSpawns: state.sunSpawns.filter(spawn => spawn.fieldIndex !== fieldIndex)
  })),
  
  getSunSpawnOnField: (fieldIndex) => {
    const { sunSpawns } = get();
    return sunSpawns.find(spawn => spawn.fieldIndex === fieldIndex && spawn.isActive);
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
}));