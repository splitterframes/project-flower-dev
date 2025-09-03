import { create } from 'zustand';

interface NotificationState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  closeNotification: () => void;
}

export const useNotification = create<NotificationState>((set) => ({
  isOpen: false,
  title: undefined,
  message: '',
  type: 'info',
  showNotification: (message: string, type = 'info', title?: string) => 
    set({ isOpen: true, message, type, title }),
  closeNotification: () => 
    set({ isOpen: false, message: '', title: undefined, type: 'info' })
}));