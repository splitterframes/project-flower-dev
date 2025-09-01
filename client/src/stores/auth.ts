import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCredits: (credits: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, isAuthenticated: true });
            console.log('🦋 Login erfolgreich:', data.user.username);
            return true;
          }
          return false;
        } catch (error) {
          console.error('❌ Login-Fehler:', error);
          return false;
        }
      },

      register: async (username: string, password: string) => {
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, isAuthenticated: true });
            console.log('🦋 Registrierung erfolgreich:', data.user.username);
            return true;
          }
          return false;
        } catch (error) {
          console.error('❌ Registrierung-Fehler:', error);
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        console.log('🦋 Logout erfolgreich');
      },

      updateCredits: (credits: number) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, credits } });
        }
      },
    }),
    {
      name: 'mariposa-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);