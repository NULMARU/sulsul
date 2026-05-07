import { create } from 'zustand';
import { db } from '@/lib/db';
import type {
  LessonProgress,
  QuizAttempt,
  DailyStreak,
  UserStats,
} from '@/types/progress';
import { scheduleNextReview, todayKey } from '@/lib/srs';

interface ProgressState {
  hydrated: boolean;
  lessons: Record<string, LessonProgress>;
  quizAttempts: Record<string, QuizAttempt>;
  bookmarks: Set<string>;
  notes: Record<string, string>;
  streak: DailyStreak;
  stats: UserStats;
  hydrate: () => Promise<void>;
  recordCardView: (lessonId: string, cardOrder: number, totalCards: number) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  recordQuizAttempt: (
    quizId: string,
    lessonId: string,
    isCorrect: boolean,
  ) => Promise<QuizAttempt>;
  toggleBookmark: (cardId: string) => Promise<void>;
  saveNote: (cardId: string, text: string) => Promise<void>;
  bumpStreak: () => Promise<void>;
  resetAll: () => Promise<void>;
  exportJson: () => string;
}

const emptyStreak: DailyStreak = { current: 0, longest: 0, lastStudyDate: '' };
const emptyStats: UserStats = {
  totalCardsViewed: 0,
  totalQuizzesAttempted: 0,
  ttsPlays: 0,
  recordingsMade: 0,
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  hydrated: false,
  lessons: {},
  quizAttempts: {},
  bookmarks: new Set(),
  notes: {},
  streak: emptyStreak,
  stats: emptyStats,

  hydrate: async () => {
    const [lessonRows, quizRows, bookmarkRows, noteRows, streakRow, statsRow] = await Promise.all([
      db.lessonProgress.toArray(),
      db.quizAttempts.toArray(),
      db.bookmarks.toArray(),
      db.notes.toArray(),
      db.streak.get('singleton'),
      db.stats.get('singleton'),
    ]);

    const lessons: Record<string, LessonProgress> = {};
    lessonRows.forEach((r) => (lessons[r.lessonId] = r));
    const quizAttempts: Record<string, QuizAttempt> = {};
    quizRows.forEach((r) => (quizAttempts[r.quizId] = r));
    const bookmarks = new Set(bookmarkRows.map((b) => b.cardId));
    const notes: Record<string, string> = {};
    noteRows.forEach((n) => (notes[n.cardId] = n.text));

    set({
      hydrated: true,
      lessons,
      quizAttempts,
      bookmarks,
      notes,
      streak: streakRow ?? emptyStreak,
      stats: statsRow ?? emptyStats,
    });
  },

  recordCardView: async (lessonId, cardOrder, totalCards) => {
    const prev = get().lessons[lessonId];
    const next: LessonProgress = {
      lessonId,
      lastViewedCardOrder: Math.max(cardOrder, prev?.lastViewedCardOrder ?? 0),
      completed: prev?.completed ?? false,
      completedAt: prev?.completedAt,
      viewCount: (prev?.viewCount ?? 0) + (prev ? 0 : 1),
    };
    if (!prev) next.viewCount = 1;
    if (cardOrder >= totalCards) {
      next.completed = true;
      next.completedAt = next.completedAt ?? new Date().toISOString();
    }
    await db.lessonProgress.put(next);
    const stats = { ...get().stats, totalCardsViewed: get().stats.totalCardsViewed + 1 };
    await db.stats.put({ id: 'singleton', ...stats });
    set({ lessons: { ...get().lessons, [lessonId]: next }, stats });
  },

  completeLesson: async (lessonId) => {
    const prev = get().lessons[lessonId];
    const next: LessonProgress = {
      lessonId,
      lastViewedCardOrder: prev?.lastViewedCardOrder ?? 0,
      completed: true,
      completedAt: prev?.completedAt ?? new Date().toISOString(),
      viewCount: prev?.viewCount ?? 1,
    };
    await db.lessonProgress.put(next);
    set({ lessons: { ...get().lessons, [lessonId]: next } });
  },

  recordQuizAttempt: async (quizId, lessonId, isCorrect) => {
    const prev = get().quizAttempts[quizId];
    const base: QuizAttempt = prev ?? {
      quizId,
      lessonId,
      attempts: 0,
      correctCount: 0,
      consecutiveCorrect: 0,
      lastAttemptAt: new Date().toISOString(),
      nextReviewAt: new Date().toISOString(),
      mastered: false,
    };
    const sched = scheduleNextReview(base, isCorrect);
    const next: QuizAttempt = {
      ...base,
      attempts: base.attempts + 1,
      correctCount: base.correctCount + (isCorrect ? 1 : 0),
      consecutiveCorrect: sched.consecutiveCorrect,
      lastAttemptAt: new Date().toISOString(),
      nextReviewAt: sched.nextReviewAt,
      mastered: sched.mastered,
    };
    await db.quizAttempts.put(next);
    const stats = {
      ...get().stats,
      totalQuizzesAttempted: get().stats.totalQuizzesAttempted + 1,
    };
    await db.stats.put({ id: 'singleton', ...stats });
    set({ quizAttempts: { ...get().quizAttempts, [quizId]: next }, stats });
    return next;
  },

  toggleBookmark: async (cardId) => {
    const has = get().bookmarks.has(cardId);
    const next = new Set(get().bookmarks);
    if (has) {
      await db.bookmarks.delete(cardId);
      next.delete(cardId);
    } else {
      await db.bookmarks.put({ cardId, createdAt: new Date().toISOString() });
      next.add(cardId);
    }
    set({ bookmarks: next });
  },

  saveNote: async (cardId, text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      await db.notes.delete(cardId);
      const next = { ...get().notes };
      delete next[cardId];
      set({ notes: next });
      return;
    }
    await db.notes.put({ cardId, text: trimmed, updatedAt: new Date().toISOString() });
    set({ notes: { ...get().notes, [cardId]: trimmed } });
  },

  bumpStreak: async () => {
    const today = todayKey();
    const prev = get().streak;
    if (prev.lastStudyDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = todayKey(yesterday);
    const continuing = prev.lastStudyDate === yKey;
    const nextCurrent = continuing ? prev.current + 1 : 1;
    const next: DailyStreak = {
      current: nextCurrent,
      longest: Math.max(prev.longest, nextCurrent),
      lastStudyDate: today,
    };
    await db.streak.put({ id: 'singleton', ...next });
    set({ streak: next });
  },

  resetAll: async () => {
    await Promise.all([
      db.lessonProgress.clear(),
      db.quizAttempts.clear(),
      db.bookmarks.clear(),
      db.notes.clear(),
      db.streak.clear(),
      db.stats.clear(),
    ]);
    set({
      lessons: {},
      quizAttempts: {},
      bookmarks: new Set(),
      notes: {},
      streak: emptyStreak,
      stats: emptyStats,
    });
  },

  exportJson: () => {
    const s = get();
    return JSON.stringify(
      {
        lessons: s.lessons,
        quizAttempts: s.quizAttempts,
        bookmarks: Array.from(s.bookmarks),
        notes: s.notes,
        streak: s.streak,
        stats: s.stats,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  },
}));
