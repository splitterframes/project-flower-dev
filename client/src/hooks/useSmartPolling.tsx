import { useEffect, useRef, useCallback } from 'react';
import { useActivity } from '@/lib/stores/useActivity';

interface UseSmartPollingOptions {
  fn: () => void | Promise<void>;
  activeMs?: number;
  idleMs?: number;
  backgroundMs?: number | null; // null = paused
  immediate?: boolean;
  enabled?: boolean;
}

export const useSmartPolling = ({
  fn,
  activeMs = 10000,   // 10 seconds when active
  idleMs = 60000,     // 60 seconds when idle
  backgroundMs = null, // paused when in background
  immediate = true,
  enabled = true,
}: UseSmartPollingOptions) => {
  const { mode } = useActivity();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const modeRef = useRef(mode);
  const fnRef = useRef(fn);
  
  // Update refs when values change
  modeRef.current = mode;
  fnRef.current = fn;

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setupInterval = useCallback(() => {
    clearCurrentInterval();
    
    if (!enabled) return;

    let intervalMs: number | null = null;
    
    switch (modeRef.current) {
      case 'active':
        intervalMs = activeMs;
        break;
      case 'idle':
        intervalMs = idleMs;
        break;
      case 'background':
        intervalMs = backgroundMs;
        break;
    }

    if (intervalMs === null) {
      // Polling is paused for this mode
      return;
    }

    intervalRef.current = setInterval(() => {
      try {
        fnRef.current();
      } catch (error) {
        console.error('Smart polling function error:', error);
      }
    }, intervalMs);
  }, [activeMs, idleMs, backgroundMs, enabled, clearCurrentInterval]);

  // Setup interval when mode changes
  useEffect(() => {
    setupInterval();
    return clearCurrentInterval;
  }, [mode, setupInterval, clearCurrentInterval]);

  // Call immediately if requested (only on mount or enabled change)
  useEffect(() => {
    if (immediate && enabled) {
      try {
        fnRef.current();
      } catch (error) {
        console.error('Smart polling immediate call error:', error);
      }
    }
  }, [immediate, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentInterval();
    };
  }, [clearCurrentInterval]);

  return {
    mode,
    forceRefresh: fn,
  };
};