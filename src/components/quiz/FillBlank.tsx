import { useState } from 'react';
import type { FillBlankQuiz } from '@/types/quiz';
import { Button } from '@/components/ui/Button';

interface Props {
  quiz: FillBlankQuiz;
  onAnswer: (answer: string) => void;
  locked: boolean;
  selectedAnswer: string | null;
  showResult: boolean;
}

function renderPrompt(prompt: string, filled?: string) {
  const parts = prompt.split(/(\_\_\_|\{blank\})/g);
  return (
    <span>
      {parts.map((p, i) =>
        p === '___' || p === '{blank}' ? (
          <span
            key={i}
            className="inline-block min-w-[3em] border-b-2 border-accent px-2 mx-0.5 text-center font-semibold"
          >
            {filled || ' '}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

export function FillBlank({ quiz, onAnswer, locked, selectedAnswer, showResult }: Props) {
  const [keyVal, setKeyVal] = useState('');

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xl en leading-relaxed">{renderPrompt(quiz.prompt, selectedAnswer ?? undefined)}</p>
        {quiz.promptKo && (
          <p className="text-sm text-text-muted mt-2">{quiz.promptKo}</p>
        )}
      </div>

      {quiz.inputMode === 'choices' && quiz.choices && (
        <div className="flex flex-col gap-2">
          {quiz.choices.map((c) => {
            const isSelected = selectedAnswer === c;
            const isAnswer = quiz.answer.includes(c);
            let style = 'bg-surface-2 border-border';
            if (showResult) {
              if (isAnswer) style = 'bg-success/20 border-success';
              else if (isSelected) style = 'bg-error/20 border-error';
            }
            return (
              <button
                key={c}
                disabled={locked}
                onClick={() => onAnswer(c)}
                className={`text-left rounded-xl border-2 px-4 py-3 en text-lg active:scale-[0.99] ${style}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {quiz.inputMode === 'keyboard' && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={selectedAnswer ?? keyVal}
            onChange={(e) => setKeyVal(e.target.value)}
            disabled={locked}
            placeholder="답을 입력하세요"
            className="en w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-lg outline-none focus:border-accent disabled:opacity-70"
            autoCapitalize="none"
            autoCorrect="off"
          />
          {!showResult && (
            <Button block disabled={!keyVal.trim()} onClick={() => onAnswer(keyVal)}>
              확인
            </Button>
          )}
          {showResult && (
            <p className="text-sm text-text-muted">
              정답: <span className="en font-medium text-text">{quiz.answer.join(' / ')}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
