import { useState, useEffect } from 'react';
import type { WordArrangeQuiz, TranslationQuiz } from '@/types/quiz';
import { Button } from '@/components/ui/Button';

interface Props {
  quiz: WordArrangeQuiz | TranslationQuiz;
  onAnswer: (answer: string[]) => void;
  locked: boolean;
  selectedAnswer: string[] | null;
  showResult: boolean;
}

export function WordArrange({ quiz, onAnswer, locked, selectedAnswer, showResult }: Props) {
  const [arranged, setArranged] = useState<string[]>([]);

  useEffect(() => {
    if (selectedAnswer) setArranged(selectedAnswer);
  }, [selectedAnswer]);

  const tokenById = Object.fromEntries(quiz.tokens.map((t) => [t.id, t]));
  const pool = quiz.tokens.map((t) => t.id).filter((id) => !arranged.includes(id));

  const pickToken = (id: string) => {
    if (locked) return;
    setArranged((a) => [...a, id]);
  };
  const removeToken = (id: string) => {
    if (locked) return;
    setArranged((a) => a.filter((x) => x !== id));
  };

  const submit = () => onAnswer(arranged);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg leading-relaxed">{quiz.promptKo}</p>

      <div className="min-h-[64px] rounded-xl border-2 border-dashed border-border p-3 flex flex-wrap gap-2 bg-surface">
        {arranged.length === 0 && (
          <span className="text-text-muted text-sm self-center">단어를 탭해서 문장을 만드세요</span>
        )}
        {arranged.map((id) => (
          <button
            key={id}
            disabled={locked}
            onClick={() => removeToken(id)}
            className="en bg-accent/30 border border-accent rounded-lg px-3 py-1.5"
          >
            {tokenById[id]?.text}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {pool.map((id) => (
          <button
            key={id}
            disabled={locked}
            onClick={() => pickToken(id)}
            className="en bg-surface-2 border border-border rounded-lg px-3 py-1.5 hover:bg-accent/20"
          >
            {tokenById[id]?.text}
          </button>
        ))}
      </div>

      {!showResult ? (
        <Button block disabled={arranged.length === 0} onClick={submit}>
          확인
        </Button>
      ) : (
        <p className="text-sm text-text-muted">
          정답:{' '}
          <span className="en font-medium text-text">
            {quiz.answer.map((id) => tokenById[id]?.text).join(' ')}
          </span>
        </p>
      )}
    </div>
  );
}
