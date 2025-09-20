import { useEffect, useRef } from 'react';
import { useActivity } from '@/lib/stores/useActivity';
import { useAuth } from '@/lib/stores/useAuth';

interface UseActivityDetectionOptions {
  idleTimeoutMs?: number;
  heartbeatIntervalMs?: number;
}

export const useActivityDetection = ({
  idleTimeoutMs = 30000, // 30 seconds
  heartbeatIntervalMs = 30000, // 30 seconds
}: UseActivityDetectionOptions = {}) => {
  const { mode, setMode, recordActivity } = useActivity();
  const { user } = useAuth();
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  // Send heartbeat to server
  const sendHeartbeat = async () => {
    if (!user?.id) return;
    
    try {
      await fetch(`/api/user/${user.id}/heartbeat`, {
        method: 'POST',
        credentials: 'include',
      });
      lastHeartbeatRef.current = Date.now();
    } catch (error) {
      console.warn('❤️ Heartbeat failed:', error);
    }
  };

  // Clear idle timeout
  const clearIdleTimeout = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  // Set idle timeout
  const setIdleTimeout = () => {
    clearIdleTimeout();
    idleTimeoutRef.current = setTimeout(() => {
      setMode('idle');
    }, idleTimeoutMs);
  };

  // Handle user activity
  const handleActivity = () => {
    recordActivity();
    setIdleTimeout();
    
    // Send heartbeat immediately if we haven't sent one recently and user is active
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
    if (timeSinceLastHeartbeat > heartbeatIntervalMs && user?.id) {
      sendHeartbeat();
    }
  };

  // Handle visibility/focus changes
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setMode('background');
      clearIdleTimeout();
    } else {
      handleActivity();
    }
  };

  const handleFocus = () => {
    handleActivity();
  };

  const handleBlur = () => {
    setMode('background');
    clearIdleTimeout();
  };

  useEffect(() => {
    // Activity event listeners
    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Visibility and focus listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initial setup
    handleActivity();

    // Start heartbeat interval only for active mode
    const setupHeartbeat = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      if (mode === 'active' && user?.id) {
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatIntervalMs);
        // Send initial heartbeat
        sendHeartbeat();
      }
    };

    setupHeartbeat();

    // Subscribe to mode changes to adjust heartbeat
    const unsubscribe = useActivity.subscribe(
      (state) => state.mode,
      (mode) => {
        if (mode === 'active' && user?.id) {
          setupHeartbeat();
        } else if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      }
    );

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      clearIdleTimeout();
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      unsubscribe();
    };
  }, [user?.id, mode, idleTimeoutMs, heartbeatIntervalMs]);

  return { mode };
};