import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ko } from '@/i18n/ko';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { loadStages } from '@/lib/content';
import type { Stage } from '@/types/content';
import { Button } from '@/components/ui/Button';
import { Progress, ProgressRing } from '@/components/ui/Progress';
import { isDueToday } from '@/lib/srs';
import { useToast } from '@/components/ui/Toast';
import {
  shouldShowReminderToday,
  markReminderShown,
  fireSystemNotification,
  getPermission,
} from '@/lib/notification';

export function HomeRoute() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const lessons = useProgressStore((s) => s.lessons);
  const quizAttempts = useProgressStore((s) => s.quizAttempts);
  const streak = useProgressStore((s) => s.streak);
  const todayGoal = useProgressStore((s) => s.todayGoal);
  const dailyMinutesGoal = useSettingsStore((s) => s.dailyMinutesGoal);
  const notificationEnabled = useSettingsStore((s) => s.notificationEnabled);
  const notificationTime = useSettingsStore((s) => s.notificationTime);
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    loadStages().then(setStages);
  }, []);

  const dueCount = useMemo(
    () => Object.values(quizAttempts).filter((a) => isDueToday(a)).length,
    [quizAttempts],
  );

  // Reminder once per day at/after the user's notification time.
  useEffect(() => {
    if (!notificationEnabled) return;
    if (!shouldShowReminderToday(notificationTime)) return;
    if (dueCount === 0 && streak.lastStudyDate === todayKeyToday()) return;
    const msg =
      dueCount > 0
        ? `오늘의 복습 ${dueCount}문항이 기다리고 있어요 🔁`
        : streak.lastStudyDate === todayKeyToday()
          ? ''
          : '오늘 잠깐 학습하면 streak 유지! 🔥';
    if (!msg) return;
    showToast(msg);
    if (getPermission() === 'granted') {
      fireSystemNotification('술술영어', msg);
    }
    markReminderShown();
  }, [notificationEnabled, notificationTime, dueCount, streak.lastStudyDate, showToast]);

  const inProgressLesson = useMemo(() => {
    const entries = Object.values(lessons).filter(
      (l) => !l.completed && l.lastViewedCardOrder > 0,
    );
    return entries.sort((a, b) => b.lastViewedCardOrder - a.lastViewedCardOrder)[0];
  }, [lessons]);

  const nextLessonId = useMemo(() => {
    for (const s of stages) {
      for (const lid of s.lessonIds) {
        if (!lessons[lid]?.completed) return lid;
      }
    }
    return null;
  }, [stages, lessons]);

  const stageProgress = (s: Stage) => {
    const total = s.lessonIds.length;
    const done = s.lessonIds.filter((id) => lessons[id]?.completed).length;
    return total > 0 ? done / total : 0;
  };

  const cta = inProgressLesson
    ? {
        label: ko.home.continue,
        onClick: () => navigate(`/lesson/${inProgressLesson.lessonId}`),
        sub: `${inProgressLesson.lessonId.replace('lesson-', '')}강 진행 중`,
      }
    : dueCount > 0
      ? {
          label: ko.home.todayReview,
          onClick: () => navigate('/review'),
          sub: `복습 대기 ${dueCount}문항`,
        }
      : nextLessonId
        ? {
            label: ko.home.nextLesson,
            onClick: () => navigate(`/lesson/${nextLessonId}`),
            sub: `${nextLessonId.replace('lesson-', '')}강부터 시작`,
          }
        : null;

  const goalSeconds = dailyMinutesGoal * 60;
  const goalProgress = goalSeconds > 0 ? Math.min(1, todayGoal.studiedSeconds / goalSeconds) : 0;
  const studiedMinutes = Math.floor(todayGoal.studiedSeconds / 60);

  return (
    <div className="px-5 pt-6 pb-6 max-w-card mx-auto w-full flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{ko.home.greeting}</h1>
        {streak.current > 0 && (
          <div className="bg-accent/20 text-accent-strong rounded-full px-3 py-1 text-sm font-medium">
            {ko.home.streak(streak.current)}
          </div>
        )}
      </header>

      <section className="rounded-3xl bg-surface border border-border p-4 flex items-center gap-4">
        <ProgressRing value={goalProgress} size={64} thickness={6}>
          <span className="text-text">{Math.round(goalProgress * 100)}%</span>
        </ProgressRing>
        <div className="flex-1">
          <div className="text-sm text-text-muted">{ko.home.todayGoal}</div>
          <div className="font-semibold">
            {ko.home.minutes(studiedMinutes)} <span className="text-text-muted text-sm">/ {ko.home.minutes(dailyMinutesGoal)}</span>
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            카드 {todayGoal.cardsViewed} · 퀴즈 {todayGoal.quizzesAttempted}
          </div>
        </div>
      </section>

      {cta && (
        <button
          onClick={cta.onClick}
          className="rounded-3xl bg-accent text-[#2A2522] p-5 text-left active:scale-[0.99] transition-all"
        >
          <div className="text-sm opacity-70">{ko.home.todayLearning}</div>
          <div className="text-2xl font-bold mt-1">{cta.label}</div>
          <div className="text-sm opacity-80 mt-2">{cta.sub} →</div>
        </button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-text-muted">{ko.home.quickStart}</h2>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          <Chip
            emoji="⚡"
            label={ko.home.quickReview1}
            onClick={() => navigate('/review?n=3')}
          />
          <Chip
            emoji="🎯"
            label={ko.home.quickReview5}
            onClick={() => navigate('/review?n=5')}
          />
          <Chip
            emoji="🔥"
            label={ko.home.quickReviewWrong}
            onClick={() => navigate('/review?wrong=1')}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-text-muted">단계별 진행률</h2>
        {stages.map((s) => {
          const pct = stageProgress(s);
          return (
            <button
              key={s.id}
              onClick={() => navigate('/stages')}
              className="rounded-2xl bg-surface border border-border p-4 text-left"
            >
              <div className="flex justify-between items-baseline mb-2">
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-text-muted">{Math.round(pct * 100)}%</div>
              </div>
              <Progress value={pct} />
            </button>
          );
        })}
      </section>

      {!cta && (
        <Button variant="secondary" onClick={() => navigate('/stages')}>
          모든 단계 보기
        </Button>
      )}
    </div>
  );
}

function Chip({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full bg-surface border border-border px-4 py-2 text-sm flex items-center gap-2 hover:bg-surface-2 active:scale-[0.97] transition-all"
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function todayKeyToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
