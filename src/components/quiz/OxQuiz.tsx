import type { OxQuiz as OxQuizType } from '@/types/quiz';

interface Props {
  quiz: OxQuizType;
  onAnswer: (answer: boolean) => void;
  locked: boolean;
  selectedAnswer: boolean | null;
  showResult: boolean;
}

export function OxQuizComponent({ quiz, onAnswer, locked, selectedAnswer, showResult }: Props) {
  const renderBtn = (val: boolean, label: string) => {
    const isSelected = selectedAnswer === val;
    const isAnswer = val === quiz.answer;
    let style = 'bg-surface-2 border-border';
    if (showResult) {
      if (isAnswer) style = 'bg-success/30 border-success';
      else if (isSelected) style = 'bg-error/30 border-error';
    }
    return (
      <button
        disabled={locked}
        onClick={() => onAnswer(val)}
        className={`flex-1 aspect-square rounded-2xl border-2 text-7xl flex items-center justify-center transition-all active:scale-[0.97] ${style}`}
        aria-label={label}
      >
        {val ? '⭕' : '❌'}
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xl en font-medium leading-relaxed">{quiz.prompt}</p>
      <div className="flex gap-4">
        {renderBtn(true, '맞다')}
        {renderBtn(false, '틀리다')}
      </div>
    </div>
  );
}
