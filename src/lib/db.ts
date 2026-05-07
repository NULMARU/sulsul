import Dexie, { type Table } from 'dexie';
import type {
  LessonProgress,
  QuizAttempt,
  DailyStreak,
  UserStats,
  BookmarkRow,
  NoteRow,
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
  }
}

export const db = new SulsulDB();
