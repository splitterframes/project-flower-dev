import { create } from 'zustand';
import { Seed, PlantedField, UserFlower, UserButterfly, FieldButterfly, ExhibitionFrame, UnlockedField } from '../types';

interface GameState {
  // Data
  seeds: Seed[];
  plantedFields: PlantedField[];
  flowers: UserFlower[];
  butterflies: UserButterfly[];
  fieldButterflies: FieldButterfly[];
  exhibitionFrames: ExhibitionFrame[];
  unlockedFields: UnlockedField[];
  nextUnlockCost: number;
  
  // Loading states
  loading: boolean;
  
  // Actions
  fetchGameData: (userId: number) => Promise<void>;
  plantSeed: (userId: number, fieldIndex: number, seedId: number) => Promise<boolean>;
  harvestFlower: (userId: number, fieldIndex: number) => Promise<boolean>;
  collectButterfly: (userId: number, fieldIndex: number) => Promise<boolean>;
  unlockField: (userId: number, fieldIndex: number) => Promise<boolean>;
  
  // Setters for optimistic updates
  setSeeds: (seeds: Seed[]) => void;
  setPlantedFields: (fields: PlantedField[]) => void;
  setFlowers: (flowers: UserFlower[]) => void;
  setButterflies: (butterflies: UserButterfly[]) => void;
  setFieldButterflies: (butterflies: FieldButterfly[]) => void;
  setUnlockedFields: (fields: UnlockedField[]) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  seeds: [],
  plantedFields: [],
  flowers: [],
  butterflies: [],
  fieldButterflies: [],
  exhibitionFrames: [],
  unlockedFields: [],
  nextUnlockCost: 1000,
  loading: false,

  // Fetch all game data
  fetchGameData: async (userId: number) => {
    set({ loading: true });
    try {
      const [seedsRes, fieldsRes, flowersRes, butterfliesRes, unlockedRes, costRes] = await Promise.all([
        fetch(`/api/user/${userId}/seeds`),
        fetch(`/api/garden/fields/${userId}`),
        fetch(`/api/user/${userId}/flowers`),
        fetch(`/api/user/${userId}/butterflies`),
        fetch(`/api/garden/unlocked/${userId}`),
        fetch(`/api/garden/unlock-cost/${userId}`),
      ]);

      const [seedsData, fieldsData, flowersData, butterfliesData, unlockedData, costData] = await Promise.all([
        seedsRes.json(),
        fieldsRes.json(),
        flowersRes.json(),
        butterfliesRes.json(),
        unlockedRes.json(),
        costRes.json(),
      ]);

      set({
        seeds: seedsData.seeds || [],
        plantedFields: fieldsData.fields || [],
        flowers: flowersData.flowers || [],
        butterflies: butterfliesData.butterflies || [],
        unlockedFields: unlockedData.unlockedFields || [],
        nextUnlockCost: costData.cost || 1000,
        loading: false,
      });

      console.log('🦋 RAW API Response - unlockedData:', unlockedData);
      console.log('🦋 Game data loaded:', {
        seeds: seedsData.seeds?.length || 0,
        fields: fieldsData.fields?.length || 0,
        flowers: flowersData.flowers?.length || 0,
        butterflies: butterfliesData.butterflies?.length || 0,
        unlockedFields: unlockedData.unlockedFields?.length || 0,
        nextUnlockCost: costData.cost || 1000,
      });
      
      console.log('🔓 Unlocked fields:', unlockedData.unlockedFields?.map((f: any) => f.fieldIndex));
    } catch (error) {
      console.error('❌ Error fetching game data:', error);
      set({ loading: false });
    }
  },

  // Plant a seed
  plantSeed: async (userId: number, fieldIndex: number, seedId: number) => {
    try {
      const response = await fetch('/api/garden/plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fieldIndex, seedId }),
      });

      if (response.ok) {
        // Refresh data after successful planting
        await get().fetchGameData(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error planting seed:', error);
      return false;
    }
  },

  // Harvest a flower
  harvestFlower: async (userId: number, fieldIndex: number) => {
    try {
      const response = await fetch('/api/garden/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fieldIndex }),
      });

      if (response.ok) {
        // Refresh data after successful harvest
        await get().fetchGameData(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error harvesting flower:', error);
      return false;
    }
  },

  // Collect butterfly (placeholder)
  collectButterfly: async (userId: number, fieldIndex: number) => {
    // TODO: Implement butterfly collection
    console.log('🦋 Collecting butterfly from field', fieldIndex);
    return true;
  },

  // Unlock a field
  unlockField: async (userId: number, fieldIndex: number) => {
    try {
      const response = await fetch('/api/garden/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fieldIndex }),
      });

      if (response.ok) {
        // Refresh data after successful unlock
        await get().fetchGameData(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error unlocking field:', error);
      return false;
    }
  },

  // Setters
  setSeeds: (seeds) => set({ seeds }),
  setPlantedFields: (plantedFields) => set({ plantedFields }),
  setFlowers: (flowers) => set({ flowers }),
  setButterflies: (butterflies) => set({ butterflies }),
  setFieldButterflies: (fieldButterflies) => set({ fieldButterflies }),
  setUnlockedFields: (unlockedFields) => set({ unlockedFields }),
}));