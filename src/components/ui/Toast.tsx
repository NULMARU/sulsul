import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';

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

export function ToastHost() {
  const msg = useToast((s) => s.msg);
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] bg-text text-bg px-4 py-2 rounded-xl text-sm shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
