import { create } from 'zustand';

interface Toast {
  id?: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastStore {
  toast: Toast | null;
  toasts: Array<Toast & { id: string; title: string }>;
  showToast: (toast: Toast) => void;
  hideToast: () => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  toasts: [],
  showToast: (toast: Toast) => {
    const id = toast.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const normalizedToast = {
      ...toast,
      id,
      title: toast.title || toast.message,
    };
    set((state) => ({ toast, toasts: [...state.toasts, normalizedToast] }));
    // Auto-hide after duration
    setTimeout(() => {
      set((state) => ({
        toast: state.toast === toast ? null : state.toast,
        toasts: state.toasts.filter((item) => item.id !== id),
      }));
    }, toast.duration || 3000);
  },
  hideToast: () => set({ toast: null }),
  removeToast: (id: string) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  })),
}));

// Helper functions for common toast types
export const useToast = () => {
  const { showToast } = useToastStore();
  
  return {
    success: (message: string, duration?: number) => 
      showToast({ type: 'success', message, duration }),
    
    error: (message: string, duration?: number) => 
      showToast({ type: 'error', message, duration }),
    
    warning: (message: string, duration?: number) => 
      showToast({ type: 'warning', message, duration }),
    
    info: (message: string, duration?: number) => 
      showToast({ type: 'info', message, duration }),
  };
};
