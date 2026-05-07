export type StageId = 'stage-1-core' | 'stage-2-extension' | 'stage-3-advanced';

export interface Stage {
  id: StageId;
  order: number;
  title: string;
  description: string;
  lessonIds: string[];
  unlockThreshold: number;
  bossQuizId: string | null;
}

export type CardType = 'hook' | 'narration' | 'analogy' | 'example' | 'summary';

export interface Example {
  emoji?: string;
  en: string;
  ko: string;
  ttsRate?: number;
}

export interface Card {
  id: string;
  order: number;
  type: CardType;
  text: string;
  examples?: Example[];
  highlight?: string;
  emoji?: string;
  tip?: string;
  afterCardQuizId?: string;
}

export interface Lesson {
  id: string;
  stageId: StageId;
  order: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  objectives: string[];
  keyPhrases: string[];
  cards: Card[];
  interstitialQuizIds: string[];
  finalQuizIds: string[];
}
