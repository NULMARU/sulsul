import { useEffect, useState } from 'react';
import { useSettingsStore, applyTheme } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';
import { listVoices, whenVoicesReady } from '@/lib/tts';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ko } from '@/i18n/ko';

export function SettingsRoute() {
  const settings = useSettingsStore();
  const stats = useProgressStore((s) => s.stats);
  const exportJson = useProgressStore((s) => s.exportJson);
  const resetAll = useProgressStore((s) => s.resetAll);
  const showToast = useToast((s) => s.show);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const update = () => setVoices(listVoices());
    update();
    whenVoicesReady(update);
  }, []);

  useEffect(() => {
    applyTheme(settings.darkMode, settings.fontSize);
  }, [settings.darkMode, settings.fontSize]);

  const onExport = () => {
    const data = exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sulsul-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('진행률 내보내기 완료');
  };

  const onReset = async () => {
    if (window.confirm('모든 진행률을 초기화할까요? 되돌릴 수 없어요.')) {
      await resetAll();
      showToast('초기화 완료');
    }
  };

  return (
    <div className="px-5 pt-6 pb-6 max-w-card mx-auto w-full flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{ko.settings.title}</h1>

      <Section title={ko.settings.display}>
        <Row label={ko.settings.darkMode}>
          <SegmentedControl
            value={settings.darkMode}
            onChange={(v) => settings.setDarkMode(v as 'system' | 'light' | 'dark')}
            options={[
              { v: 'system', l: '시스템' },
              { v: 'light', l: '라이트' },
              { v: 'dark', l: '다크' },
            ]}
          />
        </Row>
        <Row label={ko.settings.fontSize}>
          <SegmentedControl
            value={settings.fontSize}
            onChange={(v) => settings.setFontSize(v as 'sm' | 'md' | 'lg')}
            options={[
              { v: 'sm', l: ko.settings.fontSm },
              { v: 'md', l: ko.settings.fontMd },
              { v: 'lg', l: ko.settings.fontLg },
            ]}
          />
        </Row>
      </Section>

      <Section title={ko.settings.audio}>
        <Row label={ko.settings.ttsRate}>
          <SegmentedControl
            value={String(settings.ttsRate)}
            onChange={(v) => settings.setTtsRate(Number(v))}
            options={[
              { v: '0.7', l: '0.7×' },
              { v: '0.85', l: '0.85×' },
              { v: '1', l: '1×' },
              { v: '1.15', l: '1.15×' },
            ]}
          />
        </Row>
        {voices.length > 0 && (
          <Row label={ko.settings.ttsVoice}>
            <select
              value={settings.ttsVoiceURI ?? ''}
              onChange={(e) => settings.setTtsVoiceURI(e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            >
              <option value="">자동 선택</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </Row>
        )}
      </Section>

      <Section title={ko.settings.learning}>
        <Row label={ko.settings.unlockAll} inline>
          <Toggle
            value={settings.unlockAllStages}
            onChange={settings.setUnlockAll}
          />
        </Row>
      </Section>

      <Section title={ko.settings.data}>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={onExport}>
            {ko.settings.export}
          </Button>
          <Button variant="danger" onClick={onReset}>
            {ko.settings.reset}
          </Button>
        </div>
      </Section>

      <Section title={ko.settings.info}>
        <div className="text-sm text-text-muted flex flex-col gap-1">
          <div>{ko.settings.version}: 0.1.0</div>
          <div className="mt-2">
            카드 본 횟수: {stats.totalCardsViewed} · 퀴즈 시도: {stats.totalQuizzesAttempted} · TTS 재생: {stats.ttsPlays}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-text-muted mb-2">{title}</h2>
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  children,
  inline,
}: {
  label: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={inline ? 'flex items-center justify-between gap-3' : 'flex flex-col gap-2'}>
      <div className="text-sm">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="inline-flex bg-surface-2 rounded-lg p-0.5 border border-border">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            value === o.v ? 'bg-accent text-[#2A2522] font-medium' : 'text-text-muted'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        value ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}
