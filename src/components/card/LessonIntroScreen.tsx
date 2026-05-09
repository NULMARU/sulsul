import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { speak, cancel, primeEngine } from '@/lib/tts';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/Button';

interface Props {
  title: string;
  subtitle: string;
  emoji?: string;
  onContinue: () => void;
}

export function LessonIntroScreen({ title, subtitle, emoji, onContinue }: Props) {
  const narrate = useSettingsStore((s) => s.narrateLessonIntro);
  const koreanVoiceURI = useSettingsStore((s) => s.ttsKoreanVoiceURI);
  const englishVoiceURI = useSettingsStore((s) => s.ttsVoiceURI);
  const ttsRate = useSettingsStore((s) => s.ttsRate);
  const ttsPitch = useSettingsStore((s) => s.ttsPitch);
  const [speaking, setSpeaking] = useState(false);
  const startedRef = useRef(false);

  const fullText = `${title}. ${subtitle}.`;

  const play = async () => {
    primeEngine();
    setSpeaking(true);
    await speak(fullText, {
      lang: 'auto',
      rate: ttsRate,
      pitch: ttsPitch,
      voiceURIByLang: { ko: koreanVoiceURI, en: englishVoiceURI },
    });
    setSpeaking(false);
  };

  useEffect(() => {
    if (!narrate || startedRef.current) return;
    startedRef.current = true;
    const t = setTimeout(() => {
      void play();
    }, 350);
    return () => {
      clearTimeout(t);
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-card mx-auto w-full">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 180 }}
        className="text-7xl mb-6"
      >
        {emoji ?? '📘'}
      </motion.div>
      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-bold leading-tight"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-text-muted mt-2"
      >
        {subtitle}
      </motion.p>

      <button
        onClick={play}
        className={`mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-all ${
          speaking ? 'bg-accent text-[#2A2522] anim-pop' : 'bg-surface text-text hover:bg-surface-2'
        }`}
        aria-label="강 개요 듣기"
      >
        {speaking ? '⏸ 듣는 중' : '🔊 다시 듣기'}
      </button>

      <Button variant="primary" size="lg" className="mt-10" onClick={onContinue}>
        시작하기 →
      </Button>
    </div>
  );
}
