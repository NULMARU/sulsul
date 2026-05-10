import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProgressStore } from '@/stores/progressStore';
import { isDueToday } from '@/lib/srs';
import { loadAllQuizzes, listLessonIds, loadLesson } from '@/lib/content';
import type { Quiz } from '@/types/quiz';
import type { Lesson, Card } from '@/types/content';
import { QuizRunner, type QuizSessionResult } from '@/components/quiz/QuizRunner';
import { QuizResult } from '@/components/quiz/QuizResult';
import { Button } from '@/components/ui/Button';
import { useStudyTimer } from '@/lib/sessionTimer';

const DEFAULT_TARGET = 5;

export function ReviewRoute() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const targetParam = Number(params.get('n') ?? '');
  const target = Number.isFinite(targetParam) && targetParam > 0 ? Math.min(targetParam, 30) : DEFAULT_TARGET;
  const wrongOnlyParam = params.get('wrong') === '1';

  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [result, setResult] = useState<QuizSessionResult | null>(null);
  const [filterWrong, setFilterWrong] = useState(wrongOnlyParam);
  const [previewMap, setPreviewMap] = useState<Record<string, { card: Card; lesson: Lesson } | null>>({});
  const quizAttempts = useProgressStore((s) => s.quizAttempts);

  useStudyTimer(true);

  useEffect(() => {
    loadAllQuizzes().then(setAllQuizzes);
  }, []);

  // Sync filter back into URL.
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (filterWrong) next.set('wrong', '1');
    else next.delete('wrong');
    if (params.toString() !== next.toString()) {
      setParams(next, { replace: true });
    }
  }, [filterWrong, params, setParams]);

  // Compute the session deterministically — due-first by SRS priority, then stable
  // alphabetical filler. Pure render, no Math.random.
  const session = useMemo(() => {
    if (allQuizzes.length === 0) return [];
    const dueIds = Object.values(quizAttempts)
      .filter((a) => isDueToday(a))
      .filter((a) => (filterWrong ? a.consecutiveCorrect === 0 : true))
      .sort((a, b) =>
        a.consecutiveCorrect === b.consecutiveCorrect
          ? new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
          : a.consecutiveCorrect - b.consecutiveCorrect,
      )
      .slice(0, target)
      .map((a) => a.quizId);

    let picks = allQuizzes.filter((q) => dueIds.includes(q.id));

    if (!filterWrong && picks.length < target) {
      const seen = new Set(picks.map((p) => p.id));
      const filler = allQuizzes
        .filter((q) => !seen.has(q.id))
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, target - picks.length);
      picks = [...picks, ...filler];
    }
    return picks;
  }, [allQuizzes, quizAttempts, filterWrong, target]);

  // Build a quick preview map (card the quiz references, for the empty + overview state).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (session.length === 0) return;
      const map: Record<string, { card: Card; lesson: Lesson } | null> = {};
      const ids = listLessonIds();
      for (const q of session.slice(0, 5)) {
        if (map[q.id]) continue;
        const refLessonId = q.reference?.lessonId ?? q.lessonId;
        const lessonId = ids.find((l) => l === refLessonId) ?? refLessonId;
        const lesson = await loadLesson(lessonId);
        const card = lesson?.cards.find((c) => c.id === q.reference?.cardId) ?? lesson?.cards[0];
        map[q.id] = lesson && card ? { lesson, card } : null;
      }
      if (!cancelled) setPreviewMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (result) {
    return <QuizResult result={result} onHome={() => navigate('/')} />;
  }

  if (session.length === 0) {
    return (
      <div className="px-6 py-12 text-center max-w-card mx-auto flex flex-col gap-4 items-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-xl font-semibold">오늘의 복습 끝!</h2>
        <p className="text-text-muted">
          {filterWrong
            ? '어제 틀린 문제가 없어요.'
            : '복습할 문항이 없어요. 강을 더 풀어보세요!'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setFilterWrong((v) => !v)}>
            {filterWrong ? '전체 보기' : '어제 틀린 문제만'}
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            메인으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">오늘의 복습</h2>
          <div className="text-xs text-text-muted">
            {session.length}문항 · {filterWrong ? '오답만' : '진도 우선'}
          </div>
        </div>
        <button
          className="text-sm text-text-muted underline"
          onClick={() => setFilterWrong((v) => !v)}
        >
          {filterWrong ? '전체 보기' : '어제 틀린 문제만'}
        </button>
      </div>

      {/* Preview strip: shows the cards the upcoming quizzes hang off of. */}
      <div className="px-5 pt-2 pb-1 flex gap-2 overflow-x-auto">
        {session.slice(0, 5).map((q) => {
          const ref = previewMap[q.id];
          return (
            <div
              key={q.id}
              className="shrink-0 w-44 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-muted"
              title={ref?.lesson.title}
            >
              <div className="text-text font-medium truncate">
                {ref?.lesson.title ?? q.lessonId.replace('lesson-', '') + '강'}
              </div>
              <div className="line-clamp-2 mt-0.5">
                {ref?.card.text ?? q.tags?.join(' · ')}
              </div>
            </div>
          );
        })}
      </div>

      <QuizRunner quizzes={session} onFinish={setResult} onExit={() => navigate('/')} />
    </div>
  );
}
