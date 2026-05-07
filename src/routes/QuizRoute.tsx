import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadQuizzes } from '@/lib/content';
import type { Quiz } from '@/types/quiz';
import { QuizRunner, type QuizSessionResult } from '@/components/quiz/QuizRunner';
import { QuizResult } from '@/components/quiz/QuizResult';

export function QuizRoute() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [result, setResult] = useState<QuizSessionResult | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    const isBoss = lessonId.startsWith('boss-');
    loadQuizzes(lessonId).then((all) =>
      setQuizzes(isBoss ? all : all.filter((q) => q.id.includes('-fin-'))),
    );
  }, [lessonId]);

  if (result) return <QuizResult result={result} onHome={() => navigate('/')} />;
  if (quizzes.length === 0) {
    return <div className="p-8 text-center text-text-muted">불러오는 중…</div>;
  }
  return (
    <QuizRunner quizzes={quizzes} onFinish={setResult} onExit={() => navigate('/')} />
  );
}
