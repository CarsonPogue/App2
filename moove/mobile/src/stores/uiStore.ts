import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  // Modals
  isEventDetailOpen: boolean;
  selectedEventId: string | null;
  isFilterOpen: boolean;
  isInviteFriendsOpen: boolean;

  // Toasts
  toasts: Toast[];

  // Loading states
  globalLoading: boolean;

  // Actions
  openEventDetail: (eventId: string) => void;
  closeEventDetail: () => void;
  openFilter: () => void;
  closeFilter: () => void;
  openInviteFriends: () => void;
  closeInviteFriends: () => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  isEventDetailOpen: false,
  selectedEventId: null,
  isFilterOpen: false,
  isInviteFriendsOpen: false,
  toasts: [],
  globalLoading: false,

  openEventDetail: (eventId) => {
    set({ isEventDetailOpen: true, selectedEventId: eventId });
  },

  closeEventDetail: () => {
    set({ isEventDetailOpen: false, selectedEventId: null });
  },

  openFilter: () => {
    set({ isFilterOpen: true });
  },

  closeFilter: () => {
    set({ isFilterOpen: false });
  },

  openInviteFriends: () => {
    set({ isInviteFriendsOpen: true });
  },

  closeInviteFriends: () => {
    set({ isInviteFriendsOpen: false });
  },

  showToast: (toast) => {
    const id = `toast_${++toastId}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-hide after duration
    const duration = toast.duration ?? 3000;
    setTimeout(() => {
      get().hideToast(id);
    }, duration);
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setGlobalLoading: (loading) => {
    set({ globalLoading: loading });
  },
}));
