// Browser SpeechSynthesis wrapper with:
// - Separate Korean / English voice caches
// - Quality ranking (so we don't default to "Gargamel-class" old robotic voices)
// - Curated featured voice list
// - Mixed-language segmenting (Korean narration with embedded English quotes)
// - iOS Safari engine prime helper

export type Lang = 'en' | 'ko';

let allVoices: SpeechSynthesisVoice[] = [];
let voicesReady = false;
const readyCallbacks: Array<() => void> = [];

function refreshVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) {
    allVoices = v;
    voicesReady = true;
    readyCallbacks.splice(0).forEach((cb) => cb());
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

export function whenVoicesReady(cb: () => void) {
  if (voicesReady) cb();
  else readyCallbacks.push(cb);
}

// Heuristics — name-based since the Web Speech API gives us no quality flag.
// Higher score = more pleasant / more natural.
function rankVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;

  // Premium / neural / wavenet patterns
  if (/\b(premium|enhanced|natural|neural|wavenet)\b/.test(n)) s += 120;
  if (/\bonline\b/.test(n)) s += 30;

  // Known good voices
  const goodEn =
    /(samantha|ava|allison|aria|jenny|guy|tom|karen|daniel|kate|moira|tessa|fiona|zoe|joanna|matthew|emma|brian|amy|ivy|nicole|russell|google\s+(?:us|uk|english))/;
  if (goodEn.test(n) && /^en|english/i.test(v.lang)) s += 60;

  const goodKo = /(yuna|sora|heami|sun-?hi|inho|google\s+한국|google\s+korean|microsoft\s+heami|google\s+한국어)/;
  if (goodKo.test(n) && /^ko/i.test(v.lang)) s += 60;

  // Penalize obviously legacy/robotic voices
  if (/(compact|legacy|fred|ralph|junior|vicki|albert|kathy|cellos|whisper|bahh|trinoids|bubbles|hysterical|deranged|bad\s*news|good\s*news|princess|zarvox|veena|kanya|pipe|organ|boing|bells)/.test(n)) {
    s -= 120;
  }

  // Slight preference for local voices (faster, more reliable)
  if (v.localService) s += 8;

  // Region tie-breakers (en-US > en-GB > en-AU for our default)
  const lang = v.lang.toLowerCase();
  if (lang === 'en-us') s += 4;
  else if (lang === 'en-gb') s += 3;
  else if (lang === 'en-au' || lang === 'en-ca') s += 2;
  if (lang === 'ko-kr') s += 4;

  return s;
}

function listLangVoices(lang: Lang): SpeechSynthesisVoice[] {
  const prefix = lang === 'en' ? 'en' : 'ko';
  return allVoices
    .filter((v) => v.lang.toLowerCase().startsWith(prefix))
    .sort((a, b) => rankVoice(b) - rankVoice(a));
}

export function listVoices(lang?: Lang): SpeechSynthesisVoice[] {
  if (!voicesReady) refreshVoices();
  if (!lang) return [...allVoices].sort((a, b) => rankVoice(b) - rankVoice(a));
  return listLangVoices(lang);
}

// Curated picker — top N by rank, with a sensible cap so the picker stays scannable.
export function listFeaturedVoices(lang: Lang, max = 6): SpeechSynthesisVoice[] {
  return listLangVoices(lang).slice(0, max);
}

export function pickAutoVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  return listLangVoices(lang)[0];
}

export function findVoice(voiceURI: string | null | undefined): SpeechSynthesisVoice | undefined {
  if (!voiceURI) return undefined;
  return allVoices.find((v) => v.voiceURI === voiceURI);
}

// --- Mixed-language segmenting ---

interface Segment {
  lang: Lang;
  text: string;
}

const ENGLISH_RE = /[A-Za-z](?:[A-Za-z'.\-]|\s+(?=[A-Za-z]))*/g;

export function segmentMixed(input: string): Segment[] {
  const text = input.replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(ENGLISH_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) {
      const ko = text.slice(last, idx).trim();
      if (ko) out.push({ lang: 'ko', text: ko });
    }
    out.push({ lang: 'en', text: m[0].trim() });
    last = idx + m[0].length;
  }
  if (last < text.length) {
    const tail = text.slice(last).trim();
    if (tail) out.push({ lang: 'ko', text: tail });
  }
  // merge adjacent same-lang segments (in case English regex split a sentence)
  const merged: Segment[] = [];
  for (const s of out) {
    const prev = merged[merged.length - 1];
    if (prev && prev.lang === s.lang) prev.text += ' ' + s.text;
    else merged.push({ ...s });
  }
  return merged;
}

// --- Speaking ---

export interface SpeakOptions {
  lang?: Lang | 'auto';
  rate?: number;
  pitch?: number;
  voiceURI?: string | null;
  voiceURIByLang?: { en?: string | null; ko?: string | null };
  onEnd?: () => void;
  signal?: AbortSignal;
}

export function cancel() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

let primed = false;
export function primeEngine() {
  if (primed) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  primed = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

function buildUtterance(
  text: string,
  lang: Lang,
  opts: SpeakOptions,
): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  const explicit = lang === 'en' ? opts.voiceURIByLang?.en : opts.voiceURIByLang?.ko;
  const fallback = opts.voiceURI;
  const voice = findVoice(explicit ?? fallback) ?? pickAutoVoice(lang);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = lang === 'en' ? 'en-US' : 'ko-KR';
  }
  u.rate = opts.rate ?? 1.0;
  u.pitch = opts.pitch ?? 1.0;
  return u;
}

// Chrome ~200 char limit per utterance — chunk on punctuation.
function chunk(text: string, max = 180): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let buf = '';
  for (const piece of text.split(/([.!?。！？]\s+|,\s+)/)) {
    if ((buf + piece).length > max && buf) {
      out.push(buf.trim());
      buf = piece;
    } else {
      buf += piece;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }
    cancel();

    const segments: Segment[] =
      opts.lang === 'auto' || !opts.lang
        ? segmentMixed(text)
        : [{ lang: opts.lang, text }];

    if (segments.length === 0) {
      resolve();
      return;
    }

    const utterances: SpeechSynthesisUtterance[] = [];
    for (const seg of segments) {
      for (const piece of chunk(seg.text)) {
        utterances.push(buildUtterance(piece, seg.lang, opts));
      }
    }

    let aborted = false;
    const onAbort = () => {
      aborted = true;
      cancel();
      resolve();
    };
    opts.signal?.addEventListener('abort', onAbort);

    let i = 0;
    const speakNext = () => {
      if (aborted) return;
      if (i >= utterances.length) {
        opts.onEnd?.();
        opts.signal?.removeEventListener('abort', onAbort);
        resolve();
        return;
      }
      const u = utterances[i++]!;
      u.onend = speakNext;
      u.onerror = () => speakNext();
      window.speechSynthesis.speak(u);
    };
    speakNext();
  });
}

// Quick preview helper used in settings to test a voice.
export function previewVoice(voiceURI: string | null, lang: Lang, rate = 1.0, pitch = 1.0) {
  const sample =
    lang === 'en'
      ? 'Hi, this is how I sound. Let me read a sentence for you.'
      : '안녕하세요. 이 음성으로 강의를 읽어드릴게요.';
  return speak(sample, { lang, voiceURI, rate, pitch });
}

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
