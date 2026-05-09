import type { Example } from '@/types/content';
import { TtsButton } from './TtsButton';

interface ExampleBlockProps {
  example: Example;
  cardId: string;
  index: number;
  emphasize?: boolean;
  autoPlay?: boolean;
}

export function ExampleBlock({
  example,
  cardId,
  index,
  emphasize,
  autoPlay,
}: ExampleBlockProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-4 ${
        emphasize ? 'bg-accent/15 border border-accent/40' : 'bg-surface-2 border border-border'
      }`}
    >
      <TtsButton
        id={`${cardId}-ex-${index}`}
        text={example.en}
        rateOverride={example.ttsRate}
        size="md"
        autoPlay={autoPlay}
      />
      <div className="flex-1 min-w-0">
        <div className="en text-lg font-medium leading-snug">{example.en}</div>
        <div className="text-text-muted text-sm mt-0.5">{example.ko}</div>
      </div>
      {example.emoji && <span className="text-2xl shrink-0">{example.emoji}</span>}
    </div>
  );
}
