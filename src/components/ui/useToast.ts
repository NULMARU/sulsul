import { create } from 'zustand';

interface ToastState {
  msg: string | null;
  show: (m: string, ms?: number) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  msg: null,
  show: (m, ms = 1800) => {
    set({ msg: m });
    setTimeout(() => set({ msg: null }), ms);
  },
  hide: () => set({ msg: null }),
}));
