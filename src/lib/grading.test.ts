import { describe, it, expect } from 'vitest';
import { gradeQuiz } from './grading';
import type {
  MultipleChoiceQuiz,
  OxQuiz,
  FillBlankQuiz,
  WordArrangeQuiz,
  SituationMatchQuiz,
  TranslationQuiz,
} from '@/types/quiz';

const baseFields = {
  lessonId: 'lesson-01',
  difficulty: 1 as const,
  tags: ['t'],
  explanation: 'x',
};

describe('gradeQuiz', () => {
  it('multiple_choice: correct id wins', () => {
    const q: MultipleChoiceQuiz = {
      ...baseFields,
      id: 'q1',
      type: 'multiple_choice',
      prompt: 'p',
      choices: [
        { id: 'a', text: 'x' },
        { id: 'b', text: 'y' },
      ],
      answer: 'b',
    };
    expect(gradeQuiz(q, 'b')).toBe(true);
    expect(gradeQuiz(q, 'a')).toBe(false);
  });

  it('ox: boolean equality', () => {
    const q: OxQuiz = {
      ...baseFields,
      id: 'q2',
      type: 'ox',
      prompt: 'p',
      answer: false,
    };
    expect(gradeQuiz(q, false)).toBe(true);
    expect(gradeQuiz(q, true)).toBe(false);
  });

  it('fill_blank: case + whitespace insensitive, multi-answer', () => {
    const q: FillBlankQuiz = {
      ...baseFields,
      id: 'q3',
      type: 'fill_blank',
      prompt: 'I ___ coffee.',
      answer: ["don't drink", 'do not drink'],
      inputMode: 'keyboard',
    };
    expect(gradeQuiz(q, "DON'T DRINK")).toBe(true);
    expect(gradeQuiz(q, '  do not drink  ')).toBe(true);
    expect(gradeQuiz(q, 'drinks')).toBe(false);
  });

  it('word_arrange: exact order matches answer', () => {
    const q: WordArrangeQuiz = {
      ...baseFields,
      id: 'q4',
      type: 'word_arrange',
      promptKo: '나 학교 다녀',
      tokens: [
        { id: 't1', text: 'I' },
        { id: 't2', text: 'go' },
        { id: 't3', text: 'to' },
        { id: 't4', text: 'school' },
      ],
      answer: ['t1', 't2', 't3', 't4'],
    };
    expect(gradeQuiz(q, ['t1', 't2', 't3', 't4'])).toBe(true);
    expect(gradeQuiz(q, ['t2', 't1', 't3', 't4'])).toBe(false);
  });

  it('word_arrange: acceptableAnswers allow alternative orders', () => {
    const q: WordArrangeQuiz = {
      ...baseFields,
      id: 'q5',
      type: 'word_arrange',
      promptKo: '예시',
      tokens: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
      ],
      answer: ['a', 'b', 'c'],
      acceptableAnswers: [['c', 'b', 'a']],
    };
    expect(gradeQuiz(q, ['c', 'b', 'a'])).toBe(true);
    expect(gradeQuiz(q, ['b', 'a', 'c'])).toBe(false);
  });

  it('situation_match: id equality', () => {
    const q: SituationMatchQuiz = {
      ...baseFields,
      id: 'q6',
      type: 'situation_match',
      scenario: 's',
      choices: [
        { id: 'a', en: 'A' },
        { id: 'b', en: 'B' },
      ],
      answer: 'a',
    };
    expect(gradeQuiz(q, 'a')).toBe(true);
    expect(gradeQuiz(q, 'b')).toBe(false);
  });

  it('translation: same logic as word_arrange', () => {
    const q: TranslationQuiz = {
      ...baseFields,
      id: 'q7',
      type: 'translation',
      promptKo: 'p',
      tokens: [
        { id: 'x', text: 'X' },
        { id: 'y', text: 'Y' },
      ],
      answer: ['x', 'y'],
    };
    expect(gradeQuiz(q, ['x', 'y'])).toBe(true);
    expect(gradeQuiz(q, ['y', 'x'])).toBe(false);
  });

  it('rejects mismatched answer shapes', () => {
    const ox: OxQuiz = {
      ...baseFields,
      id: 'qx',
      type: 'ox',
      prompt: 'p',
      answer: true,
    };
    expect(gradeQuiz(ox, 'true' as unknown as boolean)).toBe(false);
  });
});
