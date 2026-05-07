import { describe, it, expect } from 'vitest';
import { scheduleNextReview, isDueToday, todayKey } from './srs';
import type { QuizAttempt } from '@/types/progress';

const base: QuizAttempt = {
  quizId: 'q',
  lessonId: 'lesson-01',
  attempts: 0,
  correctCount: 0,
  consecutiveCorrect: 0,
  lastAttemptAt: new Date().toISOString(),
  nextReviewAt: new Date().toISOString(),
  mastered: false,
};

function diffDays(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

describe('scheduleNextReview', () => {
  it('wrong answer resets streak and schedules tomorrow', () => {
    const r = scheduleNextReview({ ...base, consecutiveCorrect: 3 }, false);
    expect(r.consecutiveCorrect).toBe(0);
    expect(r.mastered).toBe(false);
    expect(diffDays(r.nextReviewAt)).toBe(1);
  });

  it('correct streak grows: 1→3→7→14→30 days', () => {
    const days = [1, 3, 7, 14, 30];
    let attempt = { ...base };
    for (const expected of days) {
      const r = scheduleNextReview(attempt, true);
      expect(diffDays(r.nextReviewAt)).toBe(expected);
      attempt = { ...attempt, consecutiveCorrect: r.consecutiveCorrect };
    }
    expect(attempt.consecutiveCorrect).toBe(5);
  });

  it('mastered flips to true at 5+ consecutive correct', () => {
    let attempt = { ...base };
    for (let i = 0; i < 4; i++) {
      const r = scheduleNextReview(attempt, true);
      attempt = { ...attempt, consecutiveCorrect: r.consecutiveCorrect };
      expect(r.mastered).toBe(false);
    }
    const r5 = scheduleNextReview(attempt, true);
    expect(r5.mastered).toBe(true);
    expect(r5.consecutiveCorrect).toBe(5);
  });
});

describe('isDueToday', () => {
  it('past dates are due', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    expect(isDueToday({ ...base, nextReviewAt: past })).toBe(true);
  });
  it('future dates are not due', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString();
    expect(isDueToday({ ...base, nextReviewAt: future })).toBe(false);
  });
});

describe('todayKey', () => {
  it('formats as YYYY-MM-DD', () => {
    const k = todayKey(new Date(2026, 4, 7));
    expect(k).toBe('2026-05-07');
  });
});
