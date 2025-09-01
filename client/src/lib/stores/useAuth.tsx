import { create } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  credits: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,
        
        login: async (username: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Login failed");
            }

            const data = await response.json();
            set({ user: data.user, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : "Login failed", 
              isLoading: false 
            });
          }
        },
        
        register: async (username: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch("/api/auth/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Registration failed");
            }

            const data = await response.json();
            set({ user: data.user, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : "Registration failed", 
              isLoading: false 
            });
          }
        },
        
        logout: () => {
          set({ user: null, error: null });
        },
        
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'mariposa-auth', // localStorage key
        partialize: (state) => ({ user: state.user }), // Only persist user data, not loading/error states
      }
    )
  )
);