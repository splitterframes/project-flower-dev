import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface MarketListing {
  id: number;
  sellerUsername: string;
  itemType: 'seed' | 'caterpillar';
  // Seed properties
  seedName: string;
  seedRarity: string;
  seedId?: number;
  // Caterpillar properties
  caterpillarId?: number;
  caterpillarName?: string;
  caterpillarRarity?: string;
  caterpillarImageUrl?: string;
  caterpillarIdOriginal?: number;
  // Common properties
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface UserSeed {
  id: number;
  seedId: number;
  seedName: string;
  seedRarity: string;
  quantity: number;
}

interface MarketState {
  listings: MarketListing[];
  mySeeds: UserSeed[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchListings: () => Promise<void>;
  fetchMySeeds: (userId: number) => Promise<void>;
  buyListing: (listingId: number, quantity: number) => Promise<boolean>;
  createListing: (seedId: number, quantity: number, pricePerUnit: number) => Promise<boolean>;
  clearError: () => void;
}

export const useMarket = create<MarketState>()(
  subscribeWithSelector((set, get) => ({
    listings: [],
    mySeeds: [],
    isLoading: false,
    error: null,
    
    fetchListings: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/market/listings');
        if (!response.ok) {
          throw new Error('Failed to fetch market listings');
        }
        
        const data = await response.json();
        set({ listings: data.listings || [], isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch listings', 
          isLoading: false 
        });
      }
    },
    
    fetchMySeeds: async (userId: number) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch(`/api/user/${userId}/seeds`);
        if (!response.ok) {
          throw new Error('Failed to fetch user seeds');
        }
        
        const data = await response.json();
        set({ mySeeds: data.seeds || [], isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch seeds', 
          isLoading: false 
        });
      }
    },
    
    buyListing: async (listingId: number, quantity: number) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/market/buy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': '1', // Note: This will be overridden by component
          },
          body: JSON.stringify({ listingId, quantity }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to buy listing');
        }

        // Refresh listings after successful purchase
        await get().fetchListings();
        set({ isLoading: false });
        return true;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to buy listing', 
          isLoading: false 
        });
        return false;
      }
    },
    
    createListing: async (seedId: number, quantity: number, pricePerUnit: number) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/market/create-listing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': '1', // Note: This will be overridden by component
          },
          body: JSON.stringify({ seedId, quantity, pricePerUnit }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create listing');
        }

        // Refresh listings after successful creation
        await get().fetchListings();
        set({ isLoading: false });
        return true;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create listing', 
          isLoading: false 
        });
        return false;
      }
    },
    
    clearError: () => {
      set({ error: null });
    },
  }))
);