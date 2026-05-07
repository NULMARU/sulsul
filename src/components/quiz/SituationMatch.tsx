import type { SituationMatchQuiz } from '@/types/quiz';
import { TtsButton } from '@/components/card/TtsButton';

interface Props {
  quiz: SituationMatchQuiz;
  onAnswer: (answer: string) => void;
  locked: boolean;
  selectedAnswer: string | null;
  showResult: boolean;
}

export function SituationMatch({ quiz, onAnswer, locked, selectedAnswer, showResult }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-surface-2 border border-border p-5 text-center">
        {quiz.scenarioEmoji && <div className="text-5xl mb-2">{quiz.scenarioEmoji}</div>}
        <p className="text-base leading-relaxed">{quiz.scenario}</p>
      </div>
      <div className="flex flex-col gap-2">
        {quiz.choices.map((c) => {
          const isSelected = selectedAnswer === c.id;
          const isAnswer = c.id === quiz.answer;
          let style = 'bg-surface-2 border-border';
          if (showResult) {
            if (isAnswer) style = 'bg-success/20 border-success';
            else if (isSelected) style = 'bg-error/20 border-error';
          }
          return (
            <div
              key={c.id}
              className={`rounded-xl border-2 transition-all flex items-center gap-2 pr-2 ${style}`}
            >
              <button
                type="button"
                disabled={locked}
                onClick={() => onAnswer(c.id)}
                className="text-left flex-1 min-w-0 px-4 py-3 active:scale-[0.99] disabled:opacity-100"
              >
                <div className="en text-lg font-medium">{c.en}</div>
                {c.ko && <div className="text-sm text-text-muted mt-0.5">{c.ko}</div>}
              </button>
              <TtsButton id={`${quiz.id}-c-${c.id}`} text={c.en} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
