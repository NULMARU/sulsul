import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quiz } from '@/types/quiz';
import { gradeQuiz, pickPraise, type AnswerValue } from '@/lib/grading';
import { tap, error as hapticError } from '@/lib/haptic';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ProgressDots } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { MultipleChoice } from './MultipleChoice';
import { OxQuizComponent } from './OxQuiz';
import { FillBlank } from './FillBlank';
import { WordArrange } from './WordArrange';
import { SituationMatch } from './SituationMatch';
import { speak, cancel, primeEngine } from '@/lib/tts';

export interface QuizSessionResult {
  total: number;
  correct: number;
  wrongIds: string[];
}

interface QuizRunnerProps {
  quizzes: Quiz[];
  onFinish: (result: QuizSessionResult) => void;
  onExit?: () => void;
  showProgress?: boolean;
}

type Phase = 'answering' | 'correct' | 'wrong';

export function QuizRunner({ quizzes, onFinish, onExit, showProgress = true }: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [selected, setSelected] = useState<AnswerValue | null>(null);
  const [results, setResults] = useState<{ correct: number; wrongIds: string[] }>({
    correct: 0,
    wrongIds: [],
  });
  const [praise] = useState(pickPraise());
  const recordQuizAttempt = useProgressStore((s) => s.recordQuizAttempt);
  const narrationLevel = useSettingsStore((s) => s.narrationLevel);
  const koreanVoiceURI = useSettingsStore((s) => s.ttsKoreanVoiceURI);
  const englishVoiceURI = useSettingsStore((s) => s.ttsVoiceURI);
  const ttsRate = useSettingsStore((s) => s.ttsRate);
  const ttsPitch = useSettingsStore((s) => s.ttsPitch);
  const lastNarratedRef = useRef<string | null>(null);

  const quiz = quizzes[index]!;
  const total = quizzes.length;

  // Reset answer state when the quiz index changes — derived-from-prop pattern.
  const [prevIndex, setPrevIndex] = useState(index);
  if (prevIndex !== index) {
    setPrevIndex(index);
    setPhase('answering');
    setSelected(null);
  }

  // Narrate quiz prompt when level === 'all'. We deliberately do NOT read option text,
  // both to avoid spoiling answers and to keep the audio short.
  useEffect(() => {
    if (narrationLevel !== 'all') return;
    if (lastNarratedRef.current === quiz.id) return;
    lastNarratedRef.current = quiz.id;
    primeEngine();

    const parts: string[] = [];
    if ('promptKo' in quiz && quiz.promptKo) parts.push(quiz.promptKo);
    if ('prompt' in quiz && typeof quiz.prompt === 'string') {
      // Replace blanks so TTS doesn't read "underscore underscore"
      parts.push(quiz.prompt.replace(/_+/g, ' blank '));
    }
    if (quiz.type === 'situation_match') {
      parts.push(quiz.scenario);
    }
    if (quiz.type === 'word_arrange' || quiz.type === 'translation') {
      // For arrange tasks, only read the Korean prompt — reading tokens would dump the answer.
      if (quiz.promptKo) parts.push(quiz.promptKo);
    }
    const text = parts.join('. ');
    if (!text.trim()) return;

    const t = setTimeout(() => {
      void speak(text, {
        lang: 'auto',
        rate: ttsRate,
        pitch: ttsPitch,
        voiceURIByLang: { ko: koreanVoiceURI, en: englishVoiceURI },
      });
    }, 350);
    return () => {
      clearTimeout(t);
      cancel();
    };
  }, [quiz, narrationLevel, koreanVoiceURI, englishVoiceURI, ttsRate, ttsPitch]);

  const handleAnswer = async (ans: AnswerValue) => {
    if (phase !== 'answering') return;
    setSelected(ans);
    const correct = gradeQuiz(quiz, ans);
    if (correct) {
      tap(15);
      setPhase('correct');
      setResults((r) => ({ ...r, correct: r.correct + 1 }));
      await recordQuizAttempt(quiz.id, quiz.lessonId, true);
      setTimeout(() => {
        if (index + 1 >= total) {
          onFinish({ total, correct: results.correct + 1, wrongIds: results.wrongIds });
        } else {
          setIndex((i) => i + 1);
        }
      }, 700);
    } else {
      hapticError();
      setPhase('wrong');
      setResults((r) => ({ ...r, wrongIds: [...r.wrongIds, quiz.id] }));
      await recordQuizAttempt(quiz.id, quiz.lessonId, false);
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setPhase('answering');
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      onFinish({ total, correct: results.correct, wrongIds: results.wrongIds });
    } else {
      setIndex((i) => i + 1);
    }
  };

  const showResult = phase !== 'answering';
  const locked = phase !== 'answering';

  return (
    <div className="flex flex-col h-full safe-bottom">
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        {onExit && (
          <button
            onClick={onExit}
            className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center"
            aria-label="나가기"
          >
            ✕
          </button>
        )}
        {showProgress && (
          <div className="flex-1 flex justify-center">
            <ProgressDots total={total} current={index} />
          </div>
        )}
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {quiz.type === 'multiple_choice' && (
              <MultipleChoice
                quiz={quiz}
                onAnswer={handleAnswer as (a: string) => void}
                locked={locked}
                selectedAnswer={typeof selected === 'string' ? selected : null}
                showResult={showResult}
              />
            )}
            {quiz.type === 'ox' && (
              <OxQuizComponent
                quiz={quiz}
                onAnswer={handleAnswer as (a: boolean) => void}
                locked={locked}
                selectedAnswer={typeof selected === 'boolean' ? selected : null}
                showResult={showResult}
              />
            )}
            {quiz.type === 'fill_blank' && (
              <FillBlank
                quiz={quiz}
                onAnswer={handleAnswer as (a: string) => void}
                locked={locked}
                selectedAnswer={typeof selected === 'string' ? selected : null}
                showResult={showResult}
              />
            )}
            {(quiz.type === 'word_arrange' || quiz.type === 'translation') && (
              <WordArrange
                quiz={quiz}
                onAnswer={handleAnswer as (a: string[]) => void}
                locked={locked}
                selectedAnswer={Array.isArray(selected) ? selected : null}
                showResult={showResult}
              />
            )}
            {quiz.type === 'situation_match' && (
              <SituationMatch
                quiz={quiz}
                onAnswer={handleAnswer as (a: string) => void}
                locked={locked}
                selectedAnswer={typeof selected === 'string' ? selected : null}
                showResult={showResult}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === 'correct' && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
          >
            <div className="bg-success text-white text-7xl w-28 h-28 rounded-full flex items-center justify-center shadow-2xl">
              ✓
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'wrong' && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="bg-surface border-t border-border px-5 py-4 safe-bottom"
          >
            <div className="text-error font-semibold mb-1">✗ 다시 살펴볼까요?</div>
            <p className="text-sm leading-relaxed mb-3">{quiz.explanation}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRetry}>
                다시 시도
              </Button>
              <Button variant="primary" onClick={handleNext}>
                다음
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'correct' && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="bg-success/15 border-t border-success/40 px-5 py-3 text-center text-success font-medium safe-bottom"
          >
            {praise}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
