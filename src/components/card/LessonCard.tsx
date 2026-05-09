import { useEffect, useRef, useState } from 'react';
import type { Card, Example } from '@/types/content';
import { ExampleBlock } from './ExampleBlock';
import { speak, cancel, primeEngine } from '@/lib/tts';
import { useSettingsStore, type NarrationLevel } from '@/stores/settingsStore';

interface LessonCardProps {
  card: Card;
  narrationLevel: NarrationLevel;
}

const VISIBLE_LIMIT = 3;

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

function ExampleList({
  cardId,
  examples,
  emphasize,
  autoPlayFirst,
}: {
  cardId: string;
  examples: Example[];
  emphasize?: boolean;
  autoPlayFirst?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  if (examples.length === 0) return null;
  const showAll = expanded || examples.length <= VISIBLE_LIMIT;
  const visible = showAll ? examples : examples.slice(0, VISIBLE_LIMIT);
  return (
    <div className="flex flex-col gap-3">
      {visible.map((ex, i) => (
        <ExampleBlock
          key={i}
          example={ex}
          cardId={cardId}
          index={i}
          emphasize={emphasize}
          autoPlay={autoPlayFirst && i === 0}
        />
      ))}
      {!showAll && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-text-muted self-center px-3 py-1 rounded-full hover:bg-surface-2"
        >
          예문 {examples.length - VISIBLE_LIMIT}개 더 보기 ↓
        </button>
      )}
    </div>
  );
}

function useNarrateOnEnter(card: Card, includeExample: boolean) {
  const koreanVoiceURI = useSettingsStore((s) => s.ttsKoreanVoiceURI);
  const englishVoiceURI = useSettingsStore((s) => s.ttsVoiceURI);
  const ttsRate = useSettingsStore((s) => s.ttsRate);
  const ttsPitch = useSettingsStore((s) => s.ttsPitch);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (startedFor.current === card.id) return;
    startedFor.current = card.id;
    primeEngine();

    let body = card.text.trim();
    if (includeExample && card.examples && card.examples.length > 0) {
      const ex = card.examples[0]!;
      // Pause + the example sentence (auto language segmenting handles it).
      body += `. ${ex.en}`;
    }

    const t = setTimeout(() => {
      void speak(body, {
        lang: 'auto',
        rate: ttsRate,
        pitch: ttsPitch,
        voiceURIByLang: { ko: koreanVoiceURI, en: englishVoiceURI },
      });
    }, 300);
    return () => {
      clearTimeout(t);
      cancel();
    };
  }, [card.id, card.text, card.examples, includeExample, koreanVoiceURI, englishVoiceURI, ttsRate, ttsPitch]);
}

export function LessonCard({ card, narrationLevel }: LessonCardProps) {
  const examples = card.examples ?? [];
  const fullNarration = narrationLevel === 'cards' || narrationLevel === 'all';
  const exampleOnly = narrationLevel === 'examples';

  // The hook (Korean text body + first example) is fired by this effect when narrationLevel
  // is cards/all. In examples mode, the TtsButton's autoPlay handles the English example.
  // We always run the hook (even when narrationLevel='off' it's a no-op via empty body).
  useNarrateOnEnter(card, fullNarration);

  if (card.type === 'hook') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-6 px-2">
        {card.emoji && <div className="text-7xl">{card.emoji}</div>}
        <h2 className="text-2xl font-semibold leading-relaxed">{card.text}</h2>
      </div>
    );
  }

  // Auto-play the example through TtsButton ONLY in 'examples' mode — in 'cards'/'all'
  // the hook above already chains the example. In 'off' nothing auto-plays.
  const exampleAutoPlay = exampleOnly;

  if (card.type === 'narration') {
    return (
      <div className="flex flex-col gap-6 justify-center">
        <p className="text-xl leading-relaxed">{card.text}</p>
        <ExampleList cardId={card.id} examples={examples} autoPlayFirst={exampleAutoPlay} />
      </div>
    );
  }

  if (card.type === 'analogy') {
    return (
      <div className="flex flex-col gap-6 justify-center">
        {card.emoji && <div className="text-6xl text-center">{card.emoji}</div>}
        <p className="text-xl leading-relaxed">{card.text}</p>
        <ExampleList cardId={card.id} examples={examples} autoPlayFirst={exampleAutoPlay} />
      </div>
    );
  }

  if (card.type === 'example') {
    return (
      <div className="flex flex-col gap-5 justify-center">
        <p className="text-base text-text-muted leading-relaxed">
          {renderHighlighted(card.text, card.highlight)}
        </p>
        <ExampleList
          cardId={card.id}
          examples={examples}
          emphasize
          autoPlayFirst={exampleAutoPlay}
        />
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
      <ExampleList cardId={card.id} examples={examples} autoPlayFirst={exampleAutoPlay} />
    </div>
  );
}
