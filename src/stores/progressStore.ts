import { create } from 'zustand';
import { db } from '@/lib/db';
import type {
  LessonProgress,
  QuizAttempt,
  DailyStreak,
  UserStats,
  DailyGoalRow,
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
  todayGoal: DailyGoalRow;
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
  addStudySeconds: (seconds: number) => Promise<void>;
  resetAll: () => Promise<void>;
  exportJson: () => string;
}

const emptyStreak: DailyStreak = {
  current: 0,
  longest: 0,
  lastStudyDate: '',
  freezeAvailable: true,
};
const emptyStats: UserStats = {
  totalCardsViewed: 0,
  totalQuizzesAttempted: 0,
  ttsPlays: 0,
  recordingsMade: 0,
  totalStudySeconds: 0,
};

const todayGoalDefaults = (): DailyGoalRow => ({
  date: todayKey(),
  studiedSeconds: 0,
  cardsViewed: 0,
  quizzesAttempted: 0,
});

export const useProgressStore = create<ProgressState>((set, get) => ({
  hydrated: false,
  lessons: {},
  quizAttempts: {},
  bookmarks: new Set(),
  notes: {},
  streak: emptyStreak,
  stats: emptyStats,
  todayGoal: todayGoalDefaults(),

  hydrate: async () => {
    const today = todayKey();
    const [lessonRows, quizRows, bookmarkRows, noteRows, streakRow, statsRow, todayRow] =
      await Promise.all([
        db.lessonProgress.toArray(),
        db.quizAttempts.toArray(),
        db.bookmarks.toArray(),
        db.notes.toArray(),
        db.streak.get('singleton'),
        db.stats.get('singleton'),
        db.dailyGoals.get(today),
      ]);

    const lessons: Record<string, LessonProgress> = {};
    lessonRows.forEach((r) => (lessons[r.lessonId] = r));
    const quizAttempts: Record<string, QuizAttempt> = {};
    quizRows.forEach((r) => (quizAttempts[r.quizId] = r));
    const bookmarks = new Set(bookmarkRows.map((b) => b.cardId));
    const notes: Record<string, string> = {};
    noteRows.forEach((n) => (notes[n.cardId] = n.text));

    const streak: DailyStreak = streakRow
      ? { ...streakRow, freezeAvailable: streakRow.freezeAvailable ?? true }
      : emptyStreak;

    const stats: UserStats = statsRow
      ? { ...statsRow, totalStudySeconds: statsRow.totalStudySeconds ?? 0 }
      : emptyStats;

    const todayGoal = todayRow ?? { ...todayGoalDefaults(), date: today };

    set({
      hydrated: true,
      lessons,
      quizAttempts,
      bookmarks,
      notes,
      streak,
      stats,
      todayGoal,
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
    const todayGoal = await bumpDailyGoal({ cardsViewed: 1 });
    set({ lessons: { ...get().lessons, [lessonId]: next }, stats, todayGoal });
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
    const todayGoal = await bumpDailyGoal({ quizzesAttempted: 1 });
    set({ quizAttempts: { ...get().quizAttempts, [quizId]: next }, stats, todayGoal });
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
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    const dbyKey = todayKey(dayBeforeYesterday);

    let nextCurrent: number;
    let freezeAvailable = prev.freezeAvailable;
    let freezeUsedAt = prev.freezeUsedAt;

    if (prev.lastStudyDate === yKey) {
      nextCurrent = prev.current + 1;
    } else if (prev.lastStudyDate === dbyKey && prev.freezeAvailable) {
      nextCurrent = prev.current + 1;
      freezeAvailable = false;
      freezeUsedAt = today;
    } else {
      nextCurrent = 1;
    }

    if (nextCurrent > 0 && nextCurrent % 7 === 0) {
      freezeAvailable = true;
    }

    const next: DailyStreak = {
      current: nextCurrent,
      longest: Math.max(prev.longest, nextCurrent),
      lastStudyDate: today,
      freezeAvailable,
      freezeUsedAt,
    };
    await db.streak.put({ id: 'singleton', ...next });
    set({ streak: next });
  },

  addStudySeconds: async (seconds) => {
    if (seconds <= 0) return;
    const stats = {
      ...get().stats,
      totalStudySeconds: get().stats.totalStudySeconds + seconds,
    };
    await db.stats.put({ id: 'singleton', ...stats });
    const todayGoal = await bumpDailyGoal({ studiedSeconds: seconds });
    set({ stats, todayGoal });
  },

  resetAll: async () => {
    await Promise.all([
      db.lessonProgress.clear(),
      db.quizAttempts.clear(),
      db.bookmarks.clear(),
      db.notes.clear(),
      db.streak.clear(),
      db.stats.clear(),
      db.dailyGoals.clear(),
    ]);
    set({
      lessons: {},
      quizAttempts: {},
      bookmarks: new Set(),
      notes: {},
      streak: emptyStreak,
      stats: emptyStats,
      todayGoal: todayGoalDefaults(),
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
        todayGoal: s.todayGoal,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  },
}));

async function bumpDailyGoal(delta: Partial<DailyGoalRow>): Promise<DailyGoalRow> {
  const today = todayKey();
  const prev = (await db.dailyGoals.get(today)) ?? {
    date: today,
    studiedSeconds: 0,
    cardsViewed: 0,
    quizzesAttempted: 0,
  };
  const next: DailyGoalRow = {
    date: today,
    studiedSeconds: prev.studiedSeconds + (delta.studiedSeconds ?? 0),
    cardsViewed: prev.cardsViewed + (delta.cardsViewed ?? 0),
    quizzesAttempted: prev.quizzesAttempted + (delta.quizzesAttempted ?? 0),
  };
  await db.dailyGoals.put(next);
  return next;
}
