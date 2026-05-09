import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import type { Card } from '@/types/content';
import { LessonCard } from './LessonCard';
import { tap, error } from '@/lib/haptic';
import type { NarrationLevel } from '@/stores/settingsStore';

export interface CardSwiperHandle {
  next: () => void;
  prev: () => void;
  isFirst: () => boolean;
  isLast: () => boolean;
}

interface CardSwiperProps {
  cards: Card[];
  initialIndex?: number;
  onChange?: (index: number) => void;
  onFinish: () => void;
  onCardEnter?: (card: Card) => void;
  narrationLevel: NarrationLevel;
  autoAdvanceMs?: number;
}

export const CardSwiper = forwardRef<CardSwiperHandle, CardSwiperProps>(function CardSwiper(
  {
    cards,
    initialIndex = 0,
    onChange,
    onFinish,
    onCardEnter,
    narrationLevel,
    autoAdvanceMs = 0,
  }: CardSwiperProps,
  ref,
) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const lastEnteredRef = useRef<string | null>(null);

  const card = cards[index]!;

  useEffect(() => {
    if (lastEnteredRef.current !== card.id) {
      lastEnteredRef.current = card.id;
      onCardEnter?.(card);
    }
  }, [card, onCardEnter]);

  const next = useCallback(() => {
    if (index >= cards.length - 1) {
      tap(20);
      onFinish();
      return;
    }
    setDirection(1);
    setIndex((i) => i + 1);
    onChange?.(index + 1);
    tap(10);
  }, [index, cards.length, onFinish, onChange]);

  const prev = useCallback(() => {
    if (index <= 0) {
      error();
      return;
    }
    setDirection(-1);
    setIndex((i) => i - 1);
    onChange?.(index - 1);
    tap(10);
  }, [index, onChange]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      prev,
      isFirst: () => index <= 0,
      isLast: () => index >= cards.length - 1,
    }),
    [next, prev, index, cards.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Auto-advance for hands-free / headphone listening modes.
  useEffect(() => {
    if (!autoAdvanceMs || autoAdvanceMs <= 0) return;
    const timer = window.setTimeout(() => {
      next();
    }, autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [card.id, autoAdvanceMs, next]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const w = window.innerWidth;
    const passDistance = Math.abs(info.offset.x) > w * 0.25;
    const passVelocity = Math.abs(info.velocity.x) > 400;
    if (!passDistance && !passVelocity) return;
    if (info.offset.x < 0) next();
    else prev();
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={card.id}
          custom={direction}
          initial={{ x: direction === 1 ? 60 : -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction === 1 ? -60 : 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
          className="absolute inset-0 px-5 py-6 overflow-y-auto flex flex-col"
        >
          <LessonCard card={card} narrationLevel={narrationLevel} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
