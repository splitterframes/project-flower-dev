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
  isAuthenticated: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        
        login: async (username: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ username, password }),
              credentials: "include", // Include cookies for JWT
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Login failed");
            }

            const data = await response.json();
            set({ user: data.user, isLoading: false, isAuthenticated: true });
            console.log('🔐 Login successful:', data.user.username);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : "Login failed", 
              isLoading: false,
              isAuthenticated: false
            });
            console.error('🔐 Login failed:', error);
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
              credentials: "include", // Include cookies for JWT
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Registration failed");
            }

            const data = await response.json();
            set({ user: data.user, isLoading: false, isAuthenticated: true });
            console.log('🔐 Registration successful:', data.user.username);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : "Registration failed", 
              isLoading: false,
              isAuthenticated: false
            });
            console.error('🔐 Registration failed:', error);
          }
        },
        
        logout: async () => {
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include", // Include cookies for JWT
            });
            console.log('🔐 Logout successful');
          } catch (error) {
            console.error('🔐 Logout error:', error);
          } finally {
            set({ user: null, error: null, isAuthenticated: false });
          }
        },
        
        checkAuth: async () => {
          try {
            set({ isLoading: true });
            const response = await fetch("/api/auth/me", {
              method: "GET",
              credentials: "include", // Include cookies for JWT
            });

            if (response.ok) {
              const data = await response.json();
              set({ 
                user: { 
                  id: data.user.id, 
                  username: data.user.username, 
                  credits: 0 // Will be fetched separately
                }, 
                isAuthenticated: true,
                isLoading: false 
              });
              console.log('🔐 Authentication verified:', data.user.username);
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          } catch (error) {
            console.error('🔐 Auth check failed:', error);
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },
        
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'mariposa-auth', // localStorage key
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Persist user data and auth status
      }
    )
  )
);