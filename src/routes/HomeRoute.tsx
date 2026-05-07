import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ko } from '@/i18n/ko';
import { useProgressStore } from '@/stores/progressStore';
import { loadStages } from '@/lib/content';
import type { Stage } from '@/types/content';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { isDueToday } from '@/lib/srs';

export function HomeRoute() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const lessons = useProgressStore((s) => s.lessons);
  const quizAttempts = useProgressStore((s) => s.quizAttempts);
  const streak = useProgressStore((s) => s.streak);

  useEffect(() => {
    loadStages().then(setStages);
  }, []);

  const dueCount = useMemo(
    () => Object.values(quizAttempts).filter((a) => isDueToday(a)).length,
    [quizAttempts],
  );

  const inProgressLesson = useMemo(() => {
    const entries = Object.values(lessons).filter((l) => !l.completed && l.lastViewedCardOrder > 0);
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
