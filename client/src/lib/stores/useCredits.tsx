import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface CreditsState {
  credits: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateCredits: (userId: number, amount: number) => Promise<void>;
  setCredits: (credits: number) => void;
  clearError: () => void;
}

export const useCredits = create<CreditsState>()(
  subscribeWithSelector((set, get) => ({
    credits: 0,
    isLoading: false,
    error: null,
    
    updateCredits: async (userId: number, amount: number) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch(`/api/user/${userId}/credits`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update credits");
        }

        const data = await response.json();
        set({ credits: data.credits, isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : "Failed to update credits", 
          isLoading: false 
        });
      }
    },
    
    setCredits: (credits: number) => {
      set({ credits });
    },
    
    clearError: () => {
      set({ error: null });
    },
  }))
);
