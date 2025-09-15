import { create } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  credits: number;
}

export interface UserNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  rewardType?: string;
  rewardItemId?: number;
  rewardItemName?: string;
  rewardItemRarity?: string;
  rewardAmount?: number;
  challengeId?: number;
  challengeRank?: number;
  createdAt: string;
  readAt?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasCheckedAuth: boolean; // 🔒 SECURITY: Track if server auth has been verified
  
  // Notifications
  notifications: UserNotification[];
  showNotifications: boolean;
  hasUnreadNotifications: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  
  // Notification actions  
  loadNotifications: () => Promise<void>;
  setShowNotifications: (show: boolean) => void;
  markNotificationAsRead: (notificationId: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        hasCheckedAuth: false, // 🔒 SECURITY: Starts false until server verification
        
        // Notifications
        notifications: [],
        showNotifications: false,
        hasUnreadNotifications: false,
        
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
            set({ user: data.user, isLoading: false, isAuthenticated: true, hasCheckedAuth: true });
            console.log('🔐 Login successful:', data.user.username);
            
            // Load notifications after successful login
            get().loadNotifications();
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
            set({ user: data.user, isLoading: false, isAuthenticated: true, hasCheckedAuth: true });
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
            set({ user: null, error: null, isAuthenticated: false, hasCheckedAuth: true });
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
                isLoading: false,
                hasCheckedAuth: true
              });
              console.log('🔐 Authentication verified:', data.user.username);
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false, hasCheckedAuth: true });
            }
          } catch (error) {
            console.error('🔐 Auth check failed:', error);
            set({ user: null, isAuthenticated: false, isLoading: false, hasCheckedAuth: true });
          }
        },
        
        clearError: () => {
          set({ error: null });
        },

        // Notification actions
        loadNotifications: async () => {
          const state = get();
          if (!state.user) return;

          try {
            const response = await fetch(`/api/user/${state.user.id}/notifications`);
            if (response.ok) {
              const data = await response.json();
              const notifications = data.notifications || [];
              const hasUnread = notifications.some((n: UserNotification) => !n.isRead);
              
              set({ 
                notifications,
                hasUnreadNotifications: hasUnread,
                showNotifications: hasUnread // Auto-show if there are unread notifications
              });
              
              console.log(`📨 Loaded ${notifications.length} notifications (${hasUnread ? 'has unread' : 'all read'})`);
            }
          } catch (error) {
            console.error('Failed to load notifications:', error);
          }
        },

        setShowNotifications: (show: boolean) => {
          set({ showNotifications: show });
        },

        markNotificationAsRead: async (notificationId: number) => {
          const state = get();
          if (!state.user) return;

          try {
            const response = await fetch(`/api/user/${state.user.id}/notifications/${notificationId}/read`, {
              method: 'POST'
            });
            if (response.ok) {
              set(state => ({
                notifications: state.notifications.map(n => 
                  n.id === notificationId ? { ...n, isRead: true } : n
                ),
                hasUnreadNotifications: state.notifications.some(n => 
                  n.id !== notificationId && !n.isRead
                )
              }));
            }
          } catch (error) {
            console.error('Failed to mark notification as read:', error);
          }
        },

        markAllNotificationsAsRead: async () => {
          const state = get();
          if (!state.user) return;

          try {
            const response = await fetch(`/api/user/${state.user.id}/notifications/read-all`, {
              method: 'POST'
            });
            if (response.ok) {
              set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                hasUnreadNotifications: false
              }));
            }
          } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
          }
        },
      }),
      {
        name: 'mariposa-auth', // localStorage key
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // 🔒 SECURITY: Don't persist hasCheckedAuth - force re-check on reload
      }
    )
  )
);