import { speak } from '@/lib/tts';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Recorder } from './Recorder';
import { Button } from '@/components/ui/Button';

interface Props {
  text: string;
  ko?: string;
}

export function ShadowingPanel({ text, ko }: Props) {
  const lastUrl = useAudioStore((s) => s.lastRecordingUrl);
  const ttsRate = useSettingsStore((s) => s.ttsRate);

  const compareReplay = async () => {
    await speak(text, { rate: ttsRate });
    if (lastUrl) {
      await new Promise((r) => setTimeout(r, 500));
      const audio = new Audio(lastUrl);
      audio.play();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface-2 border border-border p-4">
      <div>
        <div className="en text-lg font-medium">{text}</div>
        {ko && <div className="text-sm text-text-muted mt-1">{ko}</div>}
      </div>
      <Recorder />
      {lastUrl && (
        <Button variant="secondary" onClick={compareReplay} block>
          🔁 TTS와 비교 재생
        </Button>
      )}
    </div>
  );
}
