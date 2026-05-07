export type QuizType =
  | 'multiple_choice'
  | 'ox'
  | 'fill_blank'
  | 'word_arrange'
  | 'situation_match'
  | 'translation';

export interface QuizBase {
  id: string;
  lessonId: string;
  type: QuizType;
  difficulty: 1 | 2 | 3;
  tags: string[];
  hint?: string;
  explanation: string;
  reference?: { lessonId: string; cardId?: string };
}

export interface MultipleChoiceQuiz extends QuizBase {
  type: 'multiple_choice';
  prompt: string;
  promptKo?: string;
  choices: { id: string; text: string }[];
  answer: string;
}

export interface OxQuiz extends QuizBase {
  type: 'ox';
  prompt: string;
  answer: boolean;
}

export interface FillBlankQuiz extends QuizBase {
  type: 'fill_blank';
  prompt: string;
  promptKo?: string;
  answer: string[];
  inputMode: 'keyboard' | 'choices';
  choices?: string[];
}

export interface WordArrangeQuiz extends QuizBase {
  type: 'word_arrange';
  promptKo: string;
  tokens: { id: string; text: string }[];
  answer: string[];
  acceptableAnswers?: string[][];
}

export interface SituationMatchQuiz extends QuizBase {
  type: 'situation_match';
  scenario: string;
  scenarioEmoji?: string;
  choices: { id: string; en: string; ko?: string }[];
  answer: string;
}

export interface TranslationQuiz extends QuizBase {
  type: 'translation';
  promptKo: string;
  tokens: { id: string; text: string }[];
  answer: string[];
  acceptableAnswers?: string[][];
}

export type Quiz =
  | MultipleChoiceQuiz
  | OxQuiz
  | FillBlankQuiz
  | WordArrangeQuiz
  | SituationMatchQuiz
  | TranslationQuiz;
