import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ActivityMode = 'active' | 'idle' | 'background';

interface ActivityState {
  mode: ActivityMode;
  lastActivityAt: number;
  activeUserCount?: number;
  
  // Actions
  setMode: (mode: ActivityMode) => void;
  recordActivity: () => void;
  setActiveUserCount: (count: number) => void;
}

export const useActivity = create<ActivityState>()(
  subscribeWithSelector((set, get) => ({
    mode: 'active',
    lastActivityAt: Date.now(),
    activeUserCount: undefined,
    
    setMode: (mode: ActivityMode) => {
      set({ mode });
    },
    
    recordActivity: () => {
      set({ 
        mode: 'active',
        lastActivityAt: Date.now() 
      });
    },
    
    setActiveUserCount: (count: number) => {
      set({ activeUserCount: count });
    },
  }))
);