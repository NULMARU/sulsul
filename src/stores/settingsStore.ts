import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg';
export type NarrationLevel = 'off' | 'examples' | 'cards' | 'all';

interface SettingsState {
  darkMode: ThemeMode;
  fontSize: FontSize;
  ttsRate: number;
  ttsPitch: number;
  ttsVoiceURI: string | null;
  ttsKoreanVoiceURI: string | null;
  unlockAllStages: boolean;
  notificationEnabled: boolean;
  notificationTime: string;
  dailyMinutesGoal: number;
  narrationLevel: NarrationLevel;
  narrateLessonIntro: boolean;
  autoAdvanceMs: number;
  setDarkMode: (m: ThemeMode) => void;
  setFontSize: (s: FontSize) => void;
  setTtsRate: (r: number) => void;
  setTtsPitch: (p: number) => void;
  setTtsVoiceURI: (v: string | null) => void;
  setTtsKoreanVoiceURI: (v: string | null) => void;
  setUnlockAll: (v: boolean) => void;
  setNotificationEnabled: (v: boolean) => void;
  setNotificationTime: (t: string) => void;
  setDailyMinutesGoal: (m: number) => void;
  setNarrationLevel: (n: NarrationLevel) => void;
  setNarrateLessonIntro: (v: boolean) => void;
  setAutoAdvanceMs: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: 'system',
      fontSize: 'md',
      ttsRate: 1.25,
      ttsPitch: 1.0,
      ttsVoiceURI: null,
      ttsKoreanVoiceURI: null,
      unlockAllStages: true,
      notificationEnabled: false,
      notificationTime: '21:00',
      dailyMinutesGoal: 5,
      narrationLevel: 'examples',
      narrateLessonIntro: true,
      autoAdvanceMs: 0,
      setDarkMode: (m) => set({ darkMode: m }),
      setFontSize: (s) => set({ fontSize: s }),
      setTtsRate: (r) => set({ ttsRate: r }),
      setTtsPitch: (p) => set({ ttsPitch: p }),
      setTtsVoiceURI: (v) => set({ ttsVoiceURI: v }),
      setTtsKoreanVoiceURI: (v) => set({ ttsKoreanVoiceURI: v }),
      setUnlockAll: (v) => set({ unlockAllStages: v }),
      setNotificationEnabled: (v) => set({ notificationEnabled: v }),
      setNotificationTime: (t) => set({ notificationTime: t }),
      setDailyMinutesGoal: (m) => set({ dailyMinutesGoal: m }),
      setNarrationLevel: (n) => set({ narrationLevel: n }),
      setNarrateLessonIntro: (v) => set({ narrateLessonIntro: v }),
      setAutoAdvanceMs: (n) => set({ autoAdvanceMs: n }),
    }),
    {
      name: 'sulsul-settings',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          const hm = p.headphoneMode === true;
          if (hm && !p.narrationLevel) p.narrationLevel = 'examples';
          if (hm && p.autoAdvanceMs == null) p.autoAdvanceMs = 3000;
          delete p.headphoneMode;
          if (p.ttsRate == null) p.ttsRate = 0.95;
          if (p.ttsPitch == null) p.ttsPitch = 1.0;
        }
        if (version < 3) {
          // Bump default speech rate to 1.25 — only if user is still on a previous default.
          // Anyone who explicitly customised to a non-default value keeps their pick.
          if (p.ttsRate == null || p.ttsRate === 0.95 || p.ttsRate === 1.0) {
            p.ttsRate = 1.25;
          }
        }
        return p as Partial<SettingsState>;
      },
    },
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
