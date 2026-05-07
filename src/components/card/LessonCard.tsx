import type { Card } from '@/types/content';
import { ExampleBlock } from './ExampleBlock';

interface LessonCardProps {
  card: Card;
}

function renderHighlighted(text: string, highlight?: string) {
  if (!highlight) return text;
  const idx = text.indexOf(highlight);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/40 text-text rounded px-1">{highlight}</mark>
      {text.slice(idx + highlight.length)}
    </>
  );
}

export function LessonCard({ card }: LessonCardProps) {
  const examples = card.examples ?? [];

  if (card.type === 'hook') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-6 px-2">
        {card.emoji && <div className="text-7xl">{card.emoji}</div>}
        <h2 className="text-2xl font-semibold leading-relaxed">{card.text}</h2>
      </div>
    );
  }

  if (card.type === 'narration') {
    return (
      <div className="flex flex-col gap-6 justify-center">
        <p className="text-xl leading-relaxed">{card.text}</p>
        {examples.map((ex, i) => (
          <ExampleBlock key={i} example={ex} cardId={card.id} index={i} />
        ))}
      </div>
    );
  }

  if (card.type === 'analogy') {
    return (
      <div className="flex flex-col gap-6 justify-center">
        {card.emoji && <div className="text-6xl text-center">{card.emoji}</div>}
        <p className="text-xl leading-relaxed">{card.text}</p>
        <div className="flex flex-col gap-3">
          {examples.map((ex, i) => (
            <ExampleBlock key={i} example={ex} cardId={card.id} index={i} />
          ))}
        </div>
      </div>
    );
  }

  if (card.type === 'example') {
    return (
      <div className="flex flex-col gap-5 justify-center">
        <p className="text-base text-text-muted leading-relaxed">
          {renderHighlighted(card.text, card.highlight)}
        </p>
        <div className="flex flex-col gap-3">
          {examples.map((ex, i) => (
            <ExampleBlock key={i} example={ex} cardId={card.id} index={i} emphasize />
          ))}
        </div>
        {card.tip && (
          <div className="rounded-xl bg-surface border border-dashed border-border p-3 text-sm text-text-muted">
            💡 {card.tip}
          </div>
        )}
      </div>
    );
  }

  // summary
  return (
    <div className="flex flex-col gap-5 justify-center">
      {card.emoji && <div className="text-5xl text-center">{card.emoji}</div>}
      <div className="rounded-2xl border-2 border-accent/60 bg-accent/10 p-5">
        <p className="text-xl leading-relaxed font-medium">{card.text}</p>
      </div>
      {examples.map((ex, i) => (
        <ExampleBlock key={i} example={ex} cardId={card.id} index={i} />
      ))}
    </div>
  );
}
