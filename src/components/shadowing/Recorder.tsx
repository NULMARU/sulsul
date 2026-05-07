import { useState } from 'react';
import * as recorder from '@/lib/recorder';
import { useAudioStore } from '@/stores/audioStore';
import { useProgressStore } from '@/stores/progressStore';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function Recorder() {
  const isRecording = useAudioStore((s) => s.isRecording);
  const setRecording = useAudioStore((s) => s.setRecording);
  const setResult = useAudioStore((s) => s.setRecording_Result);
  const lastUrl = useAudioStore((s) => s.lastRecordingUrl);
  const [supported] = useState(recorder.isSupported());
  const showToast = useToast((s) => s.show);

  const start = async () => {
    try {
      await recorder.startRecording();
      setRecording(true);
    } catch {
      showToast('마이크 권한이 필요해요');
    }
  };

  const stop = async () => {
    try {
      const blob = await recorder.stopRecording();
      setRecording(false);
      setResult(blob);
      useProgressStore.setState((s) => ({
        stats: { ...s.stats, recordingsMade: s.stats.recordingsMade + 1 },
      }));
    } catch {
      setRecording(false);
    }
  };

  if (!supported) {
    return (
      <div className="text-sm text-text-muted">
        이 브라우저는 녹음 기능을 지원하지 않아요. 다른 브라우저에서 시도해보세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!isRecording ? (
        <Button variant="primary" onClick={start} block>
          🎙️ 녹음 시작
        </Button>
      ) : (
        <Button variant="danger" onClick={stop} block>
          ⏹ 녹음 중지
        </Button>
      )}
      {lastUrl && !isRecording && (
        <audio src={lastUrl} controls className="w-full" />
      )}
    </div>
  );
}
