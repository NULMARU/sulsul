let voicesCache: SpeechSynthesisVoice[] = [];
let voicesReady = false;
const readyCallbacks: Array<() => void> = [];

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) {
    voicesCache = v.filter((x) => x.lang.toLowerCase().startsWith('en'));
    voicesReady = true;
    readyCallbacks.splice(0).forEach((cb) => cb());
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!voicesReady) loadVoices();
  return voicesCache;
}

export function whenVoicesReady(cb: () => void) {
  if (voicesReady) cb();
  else readyCallbacks.push(cb);
}

export function cancel() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string | null;
  onEnd?: () => void;
}

export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }
    cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = listVoices();
    const matched =
      (opts.voiceURI && voices.find((v) => v.voiceURI === opts.voiceURI)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ||
      voices[0];
    if (matched) u.voice = matched;
    u.rate = opts.rate ?? 1.0;
    u.lang = matched?.lang || 'en-US';
    u.onend = () => {
      opts.onEnd?.();
      resolve();
    };
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
