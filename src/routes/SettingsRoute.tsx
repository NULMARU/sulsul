import { useEffect, useState } from 'react';
import { useSettingsStore, applyTheme, type NarrationLevel } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';
import {
  listFeaturedVoices,
  listVoices,
  whenVoicesReady,
  previewVoice,
  primeEngine,
  type Lang,
} from '@/lib/tts';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ko } from '@/i18n/ko';
import { getPermission, requestPermission } from '@/lib/notification';

export function SettingsRoute() {
  const settings = useSettingsStore();
  const stats = useProgressStore((s) => s.stats);
  const exportJson = useProgressStore((s) => s.exportJson);
  const resetAll = useProgressStore((s) => s.resetAll);
  const showToast = useToast((s) => s.show);
  const [voicesReady, setVoicesReady] = useState(false);
  const [showAllEn, setShowAllEn] = useState(false);
  const [showAllKo, setShowAllKo] = useState(false);
  const [permission, setPermission] = useState(getPermission());

  useEffect(() => {
    const update = () => setVoicesReady(true);
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

  const onToggleNotifications = async (v: boolean) => {
    if (v) {
      const result = await requestPermission();
      setPermission(result);
      if (result === 'denied' || result === 'unsupported') {
        showToast(
          result === 'unsupported'
            ? '이 브라우저는 알림을 지원하지 않아요'
            : '브라우저 알림 권한이 거부됐어요. 그래도 앱 안에서 토스트로 알려드려요.',
        );
      }
    }
    settings.setNotificationEnabled(v);
  };

  const studyMinutes = Math.floor(stats.totalStudySeconds / 60);

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
              { v: '0.95', l: '0.95×' },
              { v: '1', l: '1×' },
              { v: '1.15', l: '1.15×' },
            ]}
          />
        </Row>
        <Row label={ko.settings.ttsPitch}>
          <SegmentedControl
            value={String(settings.ttsPitch)}
            onChange={(v) => settings.setTtsPitch(Number(v))}
            options={[
              { v: '0.85', l: '낮게' },
              { v: '1', l: '기본' },
              { v: '1.15', l: '밝게' },
            ]}
          />
        </Row>

        {voicesReady && (
          <>
            <VoicePicker
              label={ko.settings.ttsVoiceEn}
              lang="en"
              selected={settings.ttsVoiceURI}
              onSelect={settings.setTtsVoiceURI}
              showAll={showAllEn}
              setShowAll={setShowAllEn}
              rate={settings.ttsRate}
              pitch={settings.ttsPitch}
            />
            <VoicePicker
              label={ko.settings.ttsVoiceKo}
              lang="ko"
              selected={settings.ttsKoreanVoiceURI}
              onSelect={settings.setTtsKoreanVoiceURI}
              showAll={showAllKo}
              setShowAll={setShowAllKo}
              rate={settings.ttsRate}
              pitch={settings.ttsPitch}
            />
          </>
        )}
      </Section>

      <Section title={ko.settings.narration}>
        <Row label={ko.settings.narrationLevel}>
          <SegmentedControl
            value={settings.narrationLevel}
            onChange={(v) => settings.setNarrationLevel(v as NarrationLevel)}
            options={[
              { v: 'off', l: '꺼짐' },
              { v: 'examples', l: '예문만' },
              { v: 'cards', l: '카드+예문' },
              { v: 'all', l: '전체' },
            ]}
          />
        </Row>
        <Hint text={ko.settings.narrationDesc} />
        <Row label={ko.settings.narrateLessonIntro} inline>
          <Toggle
            value={settings.narrateLessonIntro}
            onChange={settings.setNarrateLessonIntro}
          />
        </Row>
        <Hint text={ko.settings.narrateLessonIntroDesc} />
        <Row label={ko.settings.autoAdvance}>
          <SegmentedControl
            value={String(settings.autoAdvanceMs)}
            onChange={(v) => settings.setAutoAdvanceMs(Number(v))}
            options={[
              { v: '0', l: '끔' },
              { v: '4000', l: '4초' },
              { v: '6000', l: '6초' },
              { v: '10000', l: '10초' },
            ]}
          />
        </Row>
        <Hint text={ko.settings.autoAdvanceDesc} />
      </Section>

      <Section title={ko.settings.learning}>
        <Row label={ko.settings.unlockAll} inline>
          <Toggle value={settings.unlockAllStages} onChange={settings.setUnlockAll} />
        </Row>
        <Hint text={ko.settings.unlockAllDesc} />
        <Row label={ko.settings.dailyGoal}>
          <SegmentedControl
            value={String(settings.dailyMinutesGoal)}
            onChange={(v) => settings.setDailyMinutesGoal(Number(v))}
            options={[
              { v: '3', l: '3분' },
              { v: '5', l: '5분' },
              { v: '10', l: '10분' },
              { v: '20', l: '20분' },
            ]}
          />
        </Row>
        <Hint text={ko.settings.dailyGoalDesc} />
      </Section>

      <Section title={ko.settings.notifications}>
        <Row label={ko.settings.notifications} inline>
          <Toggle value={settings.notificationEnabled} onChange={onToggleNotifications} />
        </Row>
        <Row label={ko.settings.notificationTime}>
          <input
            type="time"
            value={settings.notificationTime}
            onChange={(e) => settings.setNotificationTime(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 w-full"
          />
        </Row>
        <Hint
          text={
            permission === 'granted'
              ? '브라우저 알림 권한 ✓ — 시스템 알림과 토스트 둘 다 작동해요.'
              : permission === 'denied'
                ? '브라우저 알림 권한 거부 — 토스트만 표시돼요. 권한은 브라우저 설정에서 변경 가능.'
                : ko.settings.notificationsDesc
          }
        />
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
          <div>{ko.settings.version}: 0.3.0</div>
          <div className="mt-2">
            카드 본 횟수: {stats.totalCardsViewed} · 퀴즈 시도: {stats.totalQuizzesAttempted} · 학습 시간: {studyMinutes}분 · TTS 재생: {stats.ttsPlays}
          </div>
        </div>
      </Section>
    </div>
  );
}

function VoicePicker({
  label,
  lang,
  selected,
  onSelect,
  showAll,
  setShowAll,
  rate,
  pitch,
}: {
  label: string;
  lang: Lang;
  selected: string | null;
  onSelect: (v: string | null) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  rate: number;
  pitch: number;
}) {
  const featured = listFeaturedVoices(lang, 6);
  const all = listVoices(lang);
  const list = showAll ? all : featured;

  if (all.length === 0) {
    return (
      <Row label={label}>
        <div className="text-sm text-text-muted">사용 가능한 음성이 없어요</div>
      </Row>
    );
  }

  const tryPlay = (uri: string | null) => {
    primeEngine();
    void previewVoice(uri, lang, rate, pitch);
  };

  return (
    <Row label={label}>
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm border ${
            selected == null ? 'border-accent bg-accent/10' : 'border-border bg-surface-2'
          }`}
        >
          <span>자동 선택 (추천)</span>
          {selected == null && <span className="text-accent-strong text-xs">●</span>}
        </button>
        {list.map((v) => (
          <div
            key={v.voiceURI}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm border ${
              selected === v.voiceURI ? 'border-accent bg-accent/10' : 'border-border bg-surface-2'
            }`}
          >
            <button
              onClick={() => onSelect(v.voiceURI)}
              className="flex-1 text-left flex items-center gap-2 truncate"
            >
              <span className="truncate">{v.name}</span>
              <span className="text-xs text-text-muted shrink-0">({v.lang})</span>
            </button>
            <button
              onClick={() => tryPlay(v.voiceURI)}
              className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center"
              aria-label={`${v.name} 미리듣기`}
              title="미리듣기"
            >
              ▶
            </button>
          </div>
        ))}
        {!showAll && all.length > featured.length && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-text-muted self-center mt-1"
          >
            전체 {all.length}개 보기 ↓
          </button>
        )}
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="text-xs text-text-muted self-center mt-1"
          >
            추천만 보기 ↑
          </button>
        )}
      </div>
    </Row>
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

function Hint({ text }: { text: string }) {
  return <p className="text-xs text-text-muted leading-relaxed -mt-1">{text}</p>;
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
    <div className="inline-flex bg-surface-2 rounded-lg p-0.5 border border-border flex-wrap gap-0.5">
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
