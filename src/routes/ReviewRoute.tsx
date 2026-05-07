import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '@/stores/progressStore';
import { isDueToday } from '@/lib/srs';
import { loadAllQuizzes } from '@/lib/content';
import type { Quiz } from '@/types/quiz';
import { QuizRunner, type QuizSessionResult } from '@/components/quiz/QuizRunner';
import { QuizResult } from '@/components/quiz/QuizResult';
import { Button } from '@/components/ui/Button';

const DAILY_TARGET = 5;

export function ReviewRoute() {
  const navigate = useNavigate();
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [result, setResult] = useState<QuizSessionResult | null>(null);
  const [filterWrong, setFilterWrong] = useState(false);
  const quizAttempts = useProgressStore((s) => s.quizAttempts);

  useEffect(() => {
    loadAllQuizzes().then(setAllQuizzes);
  }, []);

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
      .slice(0, DAILY_TARGET)
      .map((a) => a.quizId);

    let picks = allQuizzes.filter((q) => dueIds.includes(q.id));

    if (!filterWrong && picks.length < DAILY_TARGET) {
      const seen = new Set(picks.map((p) => p.id));
      const filler = allQuizzes
        .filter((q) => !seen.has(q.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, DAILY_TARGET - picks.length);
      picks = [...picks, ...filler];
    }
    return picks;
  }, [allQuizzes, quizAttempts, filterWrong]);

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
        <h2 className="font-semibold">오늘의 복습</h2>
        <button
          className="text-sm text-text-muted underline"
          onClick={() => setFilterWrong((v) => !v)}
        >
          {filterWrong ? '전체 보기' : '어제 틀린 문제만'}
        </button>
      </div>
      <QuizRunner quizzes={session} onFinish={setResult} onExit={() => navigate('/')} />
    </div>
  );
}
