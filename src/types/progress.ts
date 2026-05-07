export interface LessonProgress {
  lessonId: string;
  lastViewedCardOrder: number;
  completed: boolean;
  completedAt?: string;
  viewCount: number;
}

export interface QuizAttempt {
  quizId: string;
  lessonId: string;
  attempts: number;
  correctCount: number;
  consecutiveCorrect: number;
  lastAttemptAt: string;
  nextReviewAt: string;
  mastered: boolean;
}

export interface DailyStreak {
  current: number;
  longest: number;
  lastStudyDate: string;
}

export interface UserStats {
  totalCardsViewed: number;
  totalQuizzesAttempted: number;
  ttsPlays: number;
  recordingsMade: number;
}

export interface BookmarkRow {
  cardId: string;
  createdAt: string;
}

export interface NoteRow {
  cardId: string;
  text: string;
  updatedAt: string;
}
