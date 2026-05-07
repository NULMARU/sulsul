import type { QuizAttempt } from '@/types/progress';

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function scheduleNextReview(
  attempt: QuizAttempt,
  isCorrect: boolean,
): { nextReviewAt: string; mastered: boolean; consecutiveCorrect: number } {
  const now = new Date();
  if (!isCorrect) {
    return {
      nextReviewAt: addDays(now, 1).toISOString(),
      mastered: false,
      consecutiveCorrect: 0,
    };
  }
  const next = attempt.consecutiveCorrect + 1;
  let days: number;
  let mastered = false;
  switch (next) {
    case 1: days = 1; break;
    case 2: days = 3; break;
    case 3: days = 7; break;
    case 4: days = 14; break;
    default:
      days = 30;
      mastered = true;
  }
  return {
    nextReviewAt: addDays(now, days).toISOString(),
    mastered,
    consecutiveCorrect: next,
  };
}

export function isDueToday(attempt: QuizAttempt, now = new Date()): boolean {
  return new Date(attempt.nextReviewAt) <= now;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
