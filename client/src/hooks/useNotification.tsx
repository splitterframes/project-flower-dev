import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
}

export type ShowNotification = {
  (message: string): void;
  (message: string, type: NotificationType): void;
  (title: string, message: string): void;
  (title: string, message: string, type: NotificationType): void;
  (options: NotificationOptions): void;
};

interface NotificationState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: NotificationType;
  showNotification: ShowNotification;
  closeNotification: () => void;
}

const isNotificationType = (value: unknown): value is NotificationType =>
  value === 'success' || value === 'error' || value === 'warning' || value === 'info';

const normalizeArgs = (
  titleOrOptions: string | NotificationOptions,
  messageOrType?: string | NotificationType,
  typeArg?: NotificationType
): NotificationOptions & { type: NotificationType } => {
  if (typeof titleOrOptions === 'object') {
    return {
      title: titleOrOptions.title,
      message: titleOrOptions.message,
      type: titleOrOptions.type ?? 'info'
    };
  }

  const first = titleOrOptions;

  if (typeof messageOrType === 'undefined') {
    return { title: undefined, message: first, type: 'info' };
  }

  if (isNotificationType(messageOrType)) {
    return { title: undefined, message: first, type: messageOrType };
  }

  return {
    title: first,
    message: messageOrType,
    type: typeArg && isNotificationType(typeArg) ? typeArg : 'info'
  };
};

export const useNotification = create<NotificationState>((set) => {
  const showNotification: ShowNotification = (
    titleOrOptions: string | NotificationOptions,
    messageOrType?: string | NotificationType,
    typeArg?: NotificationType
  ) => {
    const { title, message, type } = normalizeArgs(titleOrOptions, messageOrType, typeArg);
    set({ isOpen: true, title, message, type });
  };

  return {
    isOpen: false,
    title: undefined,
    message: '',
    type: 'info',
    showNotification,
    closeNotification: () => set({ isOpen: false, message: '', title: undefined, type: 'info' })
  };
});