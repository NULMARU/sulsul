import { useEffect, useRef } from 'react';
import { speak, cancel } from '@/lib/tts';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';

interface TtsButtonProps {
  text: string;
  id: string;
  rateOverride?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TtsButton({
  text,
  id,
  rateOverride,
  size = 'md',
  className = '',
}: TtsButtonProps) {
  const playing = useAudioStore((s) => s.currentlyPlayingId);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const ttsRate = useSettingsStore((s) => s.ttsRate);
  const ttsVoiceURI = useSettingsStore((s) => s.ttsVoiceURI);
  const isMe = playing === id;
  const isPlayingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (isPlayingRef.current) cancel();
    };
  }, []);

  const onClick = async () => {
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
    await speak(text, { rate: rateOverride ?? ttsRate, voiceURI: ttsVoiceURI });
    isPlayingRef.current = false;
    setPlaying(null);
  };

  const sizes = {
    sm: 'w-8 h-8 text-base',
    md: 'w-11 h-11 text-xl',
    lg: 'w-14 h-14 text-2xl',
  };

  return (
    <button
      onClick={onClick}
      aria-label={isMe ? '재생 중지' : 'TTS 재생'}
      className={`${sizes[size]} rounded-full flex items-center justify-center transition-all ${
        isMe
          ? 'bg-accent text-[#2A2522] anim-pop'
          : 'bg-surface-2 text-text hover:bg-accent/40'
      } ${className}`}
    >
      {isMe ? '⏸' : '🔊'}
    </button>
  );
}
