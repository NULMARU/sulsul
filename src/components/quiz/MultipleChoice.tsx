import type { MultipleChoiceQuiz } from '@/types/quiz';

interface Props {
  quiz: MultipleChoiceQuiz;
  onAnswer: (answer: string) => void;
  locked: boolean;
  selectedAnswer: string | null;
  showResult: boolean;
}

export function MultipleChoice({ quiz, onAnswer, locked, selectedAnswer, showResult }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xl en font-medium leading-relaxed">{quiz.prompt}</p>
        {quiz.promptKo && (
          <p className="text-sm text-text-muted mt-2">{quiz.promptKo}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {quiz.choices.map((c) => {
          const isSelected = selectedAnswer === c.id;
          const isAnswer = c.id === quiz.answer;
          let style = 'bg-surface-2 border-border text-text';
          if (showResult) {
            if (isAnswer) style = 'bg-success/20 border-success text-text';
            else if (isSelected) style = 'bg-error/20 border-error text-text';
          }
          return (
            <button
              key={c.id}
              disabled={locked}
              onClick={() => onAnswer(c.id)}
              className={`text-left rounded-xl border-2 px-4 py-3.5 transition-all en text-lg active:scale-[0.99] ${style}`}
            >
              {c.text}
              {showResult && isAnswer && <span className="float-right">✓</span>}
              {showResult && isSelected && !isAnswer && (
                <span className="float-right">✗</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
