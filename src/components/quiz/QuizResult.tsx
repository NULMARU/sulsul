import type { QuizSessionResult } from './QuizRunner';
import { Button } from '@/components/ui/Button';

interface Props {
  result: QuizSessionResult;
  onHome: () => void;
  onReview?: () => void;
}

export function QuizResult({ result, onHome, onReview }: Props) {
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10 max-w-card mx-auto">
      <div className="text-7xl">
        {pct === 100 ? '🎉' : pct >= 70 ? '👏' : '💪'}
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold mb-1">
          {result.correct} / {result.total}
        </div>
        <div className="text-text-muted">{pct}% 정답</div>
      </div>
      <div className="rounded-xl bg-surface-2 border border-border px-4 py-3 text-sm text-text-muted">
        틀린 문항은 복습 큐에 자동으로 추가됐어요. 내일 다시 만나요!
      </div>
      <div className="flex flex-col gap-2 w-full">
        {onReview && result.wrongIds.length > 0 && (
          <Button variant="secondary" block onClick={onReview}>
            틀린 문항 복습하기
          </Button>
        )}
        <Button variant="primary" block onClick={onHome}>
          메인으로
        </Button>
      </div>
    </div>
  );
}
