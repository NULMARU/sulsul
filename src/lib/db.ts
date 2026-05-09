import Dexie, { type Table } from 'dexie';
import type {
  LessonProgress,
  QuizAttempt,
  DailyStreak,
  UserStats,
  BookmarkRow,
  NoteRow,
  DailyGoalRow,
} from '@/types/progress';

type StreakRow = DailyStreak & { id: 'singleton' };
type StatsRow = UserStats & { id: 'singleton' };

export class SulsulDB extends Dexie {
  lessonProgress!: Table<LessonProgress, string>;
  quizAttempts!: Table<QuizAttempt, string>;
  bookmarks!: Table<BookmarkRow, string>;
  notes!: Table<NoteRow, string>;
  streak!: Table<StreakRow, 'singleton'>;
  stats!: Table<StatsRow, 'singleton'>;
  dailyGoals!: Table<DailyGoalRow, string>;

  constructor() {
    super('sulsul-db');
    this.version(1).stores({
      lessonProgress: 'lessonId, completed',
      quizAttempts: 'quizId, lessonId, nextReviewAt, mastered',
      bookmarks: 'cardId, createdAt',
      notes: 'cardId',
      streak: 'id',
      stats: 'id',
    });
    this.version(2).stores({
      lessonProgress: 'lessonId, completed',
      quizAttempts: 'quizId, lessonId, nextReviewAt, mastered',
      bookmarks: 'cardId, createdAt',
      notes: 'cardId',
      streak: 'id',
      stats: 'id',
      dailyGoals: 'date',
    });
  }
}

export const db = new SulsulDB();
