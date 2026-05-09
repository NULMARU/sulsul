// Deep resume — remember exactly where the user was so a cold open lands back instantly.

const KEY = 'sulsul-deep-resume';

export interface ResumeState {
  path: string;
  lessonId?: string;
  cardOrder?: number;
  phase?: 'cards' | 'interstitial' | 'final-quiz' | 'result';
  updatedAt: number;
}

export function saveResume(state: Omit<ResumeState, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: ResumeState = { ...state, updatedAt: Date.now() };
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function loadResume(): ResumeState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.sessionStorage.getItem(KEY) ?? window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResumeState;
    return parsed;
  } catch {
    return null;
  }
}

export function clearResume() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
