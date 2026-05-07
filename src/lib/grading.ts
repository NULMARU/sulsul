import type {
  Quiz,
  MultipleChoiceQuiz,
  OxQuiz,
  FillBlankQuiz,
  WordArrangeQuiz,
  SituationMatchQuiz,
  TranslationQuiz,
} from '@/types/quiz';

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function gradeMultipleChoice(q: MultipleChoiceQuiz, answer: string): boolean {
  return answer === q.answer;
}

export function gradeOx(q: OxQuiz, answer: boolean): boolean {
  return answer === q.answer;
}

export function gradeFillBlank(q: FillBlankQuiz, answer: string): boolean {
  const a = normalizeText(answer);
  return q.answer.some((ans) => normalizeText(ans) === a);
}

function arrayEq(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function gradeWordArrange(q: WordArrangeQuiz, tokenIds: string[]): boolean {
  if (arrayEq(tokenIds, q.answer)) return true;
  if (q.acceptableAnswers) {
    return q.acceptableAnswers.some((alt) => arrayEq(tokenIds, alt));
  }
  return false;
}

export function gradeSituation(q: SituationMatchQuiz, answer: string): boolean {
  return answer === q.answer;
}

export function gradeTranslation(q: TranslationQuiz, tokenIds: string[]): boolean {
  if (arrayEq(tokenIds, q.answer)) return true;
  if (q.acceptableAnswers) {
    return q.acceptableAnswers.some((alt) => arrayEq(tokenIds, alt));
  }
  return false;
}

export type AnswerValue = string | boolean | string[];

export function gradeQuiz(q: Quiz, answer: AnswerValue): boolean {
  switch (q.type) {
    case 'multiple_choice':
      return typeof answer === 'string' && gradeMultipleChoice(q, answer);
    case 'ox':
      return typeof answer === 'boolean' && gradeOx(q, answer);
    case 'fill_blank':
      return typeof answer === 'string' && gradeFillBlank(q, answer);
    case 'word_arrange':
      return Array.isArray(answer) && gradeWordArrange(q, answer);
    case 'situation_match':
      return typeof answer === 'string' && gradeSituation(q, answer);
    case 'translation':
      return Array.isArray(answer) && gradeTranslation(q, answer);
  }
}

export function pickPraise(): string {
  const pool = ['정확해요!', '잘했어요 🎯', '계속 이렇게!', '감 잡으셨네요', '👏'];
  return pool[Math.floor(Math.random() * pool.length)]!;
}
