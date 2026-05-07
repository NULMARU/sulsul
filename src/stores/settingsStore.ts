import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg';

interface SettingsState {
  darkMode: ThemeMode;
  fontSize: FontSize;
  ttsRate: number;
  ttsVoiceURI: string | null;
  unlockAllStages: boolean;
  notificationEnabled: boolean;
  setDarkMode: (m: ThemeMode) => void;
  setFontSize: (s: FontSize) => void;
  setTtsRate: (r: number) => void;
  setTtsVoiceURI: (v: string | null) => void;
  setUnlockAll: (v: boolean) => void;
  setNotificationEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: 'system',
      fontSize: 'md',
      ttsRate: 1.0,
      ttsVoiceURI: null,
      unlockAllStages: false,
      notificationEnabled: false,
      setDarkMode: (m) => set({ darkMode: m }),
      setFontSize: (s) => set({ fontSize: s }),
      setTtsRate: (r) => set({ ttsRate: r }),
      setTtsVoiceURI: (v) => set({ ttsVoiceURI: v }),
      setUnlockAll: (v) => set({ unlockAllStages: v }),
      setNotificationEnabled: (v) => set({ notificationEnabled: v }),
    }),
    { name: 'sulsul-settings' },
  ),
);

export function applyTheme(mode: ThemeMode, fontSize: FontSize) {
  const root = document.documentElement;
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  root.dataset.theme = resolved;
  root.dataset.fontSize = fontSize;
}
