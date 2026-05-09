import { useEffect, useRef } from 'react';
import { speak, cancel, primeEngine, type Lang } from '@/lib/tts';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';

interface TtsButtonProps {
  text: string;
  id: string;
  lang?: Lang | 'auto';
  rateOverride?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export function TtsButton({
  text,
  id,
  lang = 'en',
  rateOverride,
  size = 'md',
  className = '',
  autoPlay = false,
  onEnded,
}: TtsButtonProps) {
  const playing = useAudioStore((s) => s.currentlyPlayingId);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const ttsRate = useSettingsStore((s) => s.ttsRate);
  const ttsPitch = useSettingsStore((s) => s.ttsPitch);
  const ttsVoiceURI = useSettingsStore((s) => s.ttsVoiceURI);
  const ttsKoreanVoiceURI = useSettingsStore((s) => s.ttsKoreanVoiceURI);
  const isMe = playing === id;
  const isPlayingRef = useRef(false);
  const autoPlayedRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (isPlayingRef.current) cancel();
    };
  }, []);

  const play = async () => {
    primeEngine();
    if (isMe) {
      cancel();
      setPlaying(null);
      isPlayingRef.current = false;
      return;
    }
    setPlaying(id);
    isPlayingRef.current = true;
    useProgressStore.setState((s) => ({
      stats: { ...s.stats, ttsPlays: s.stats.ttsPlays + 1 },
    }));
    await speak(text, {
      lang,
      rate: rateOverride ?? ttsRate,
      pitch: ttsPitch,
      voiceURIByLang: { en: ttsVoiceURI, ko: ttsKoreanVoiceURI },
    });
    isPlayingRef.current = false;
    setPlaying(null);
    onEnded?.();
  };

  useEffect(() => {
    if (autoPlay && autoPlayedRef.current !== id) {
      autoPlayedRef.current = id;
      const t = setTimeout(() => {
        void play();
      }, 250);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, id]);

  const sizes = {
    sm: 'w-9 h-9 text-base',
    md: 'w-11 h-11 text-xl',
    lg: 'w-14 h-14 text-2xl',
  };

  return (
    <button
      onClick={play}
      aria-label={isMe ? '재생 중지' : 'TTS 재생'}
      className={`${sizes[size]} rounded-full flex items-center justify-center transition-all shrink-0 ${
        isMe
          ? 'bg-accent text-[#2A2522] anim-pop'
          : 'bg-surface text-text border border-border hover:bg-accent/30'
      } ${className}`}
    >
      {isMe ? '⏸' : '🔊'}
    </button>
  );
}
