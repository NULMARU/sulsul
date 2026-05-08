import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadLesson, loadQuizzes, prefetchLesson, listLessonIds } from '@/lib/content';
import type { Lesson, Card } from '@/types/content';
import type { Quiz } from '@/types/quiz';
import { useProgressStore } from '@/stores/progressStore';
import { CardSwiper, type CardSwiperHandle } from '@/components/card/CardSwiper';
import { Sheet } from '@/components/ui/Sheet';
import { ProgressDots } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { QuizRunner, type QuizSessionResult } from '@/components/quiz/QuizRunner';
import { QuizResult } from '@/components/quiz/QuizResult';
import { ShadowingPanel } from '@/components/shadowing/ShadowingPanel';
import { useToast } from '@/components/ui/Toast';

type Phase = 'cards' | 'interstitial' | 'final-quiz' | 'result';

export function LessonRoute() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [phase, setPhase] = useState<Phase>('cards');
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [interQuiz, setInterQuiz] = useState<Quiz | null>(null);
  const [resumeIndex, setResumeIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [result, setResult] = useState<QuizSessionResult | null>(null);
  const swiperRef = useRef<CardSwiperHandle | null>(null);

  const lessons = useProgressStore((s) => s.lessons);
  const bookmarks = useProgressStore((s) => s.bookmarks);
  const notes = useProgressStore((s) => s.notes);
  const recordCardView = useProgressStore((s) => s.recordCardView);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);
  const saveNote = useProgressStore((s) => s.saveNote);
  const bumpStreak = useProgressStore((s) => s.bumpStreak);
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    if (!lessonId) return;
    void Promise.all([loadLesson(lessonId), loadQuizzes(lessonId)]).then(([l, q]) => {
      if (!l) return;
      setLesson(l);
      setQuizzes(q);
      const lp = lessons[lessonId];
      if (lp && lp.lastViewedCardOrder > 0 && lp.lastViewedCardOrder < l.cards.length) {
        setResumeIndex(lp.lastViewedCardOrder - 1);
      }
    });
    // prefetch next
    const ids = listLessonIds();
    const idx = ids.indexOf(lessonId);
    if (idx >= 0 && idx < ids.length - 1) {
      prefetchLesson(ids[idx + 1]!);
    }
  }, [lessonId, lessons]);

  const finalQuizzes = useMemo(
    () =>
      lesson?.finalQuizIds
        .map((id) => quizzes.find((q) => q.id === id))
        .filter((q): q is Quiz => !!q) ?? [],
    [lesson, quizzes],
  );

  if (!lesson) {
    return <div className="p-8 text-center text-text-muted">불러오는 중…</div>;
  }

  const handleCardEnter = (card: Card) => {
    setActiveCard(card);
    setCardIndex(card.order - 1);
    void recordCardView(lesson.id, card.order, lesson.cards.length);
    if (card.afterCardQuizId) {
      const q = quizzes.find((x) => x.id === card.afterCardQuizId);
      if (q) {
        // queue interstitial after slight delay so card animates first
        setTimeout(() => {
          setInterQuiz(q);
          setPhase('interstitial');
        }, 100);
      }
    }
  };

  const handleSwipeFinish = () => {
    setPhase('final-quiz');
  };

  const handleInterstitialFinish = () => {
    setInterQuiz(null);
    setPhase('cards');
  };

  const handleFinalFinish = (r: QuizSessionResult) => {
    setResult(r);
    setPhase('result');
    void completeLesson(lesson.id);
    void bumpStreak();
  };

  const isBookmarked = activeCard ? bookmarks.has(activeCard.id) : false;
  const currentNote = activeCard ? notes[activeCard.id] ?? '' : '';

  if (phase === 'interstitial' && interQuiz) {
    return (
      <div className="flex flex-col h-full">
        <QuizRunner
          quizzes={[interQuiz]}
          onFinish={handleInterstitialFinish}
          showProgress={false}
        />
      </div>
    );
  }

  if (phase === 'final-quiz') {
    if (finalQuizzes.length === 0) {
      handleFinalFinish({ total: 0, correct: 0, wrongIds: [] });
      return null;
    }
    return (
      <div className="flex flex-col h-full">
        <QuizRunner
          quizzes={finalQuizzes}
          onFinish={handleFinalFinish}
          onExit={() => navigate('/')}
        />
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <QuizResult
        result={result}
        onHome={() => navigate('/')}
      />
    );
  }

  const example = activeCard?.examples?.[0];
  const isFirst = cardIndex <= 0;
  const isLast = cardIndex >= lesson.cards.length - 1;

  return (
    <div className="flex flex-col h-full max-w-card mx-auto w-full">
      <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <button
          onClick={() => navigate('/stages')}
          className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center"
          aria-label="나가기"
        >
          ✕
        </button>
        <ProgressDots total={lesson.cards.length} current={cardIndex} />
        <div className="flex gap-1">
          {example && (
            <button
              onClick={() => setShadowOpen(true)}
              className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center"
              aria-label="쉐도잉"
              title="쉐도잉"
            >
              🎙️
            </button>
          )}
          <button
            onClick={async () => {
              if (!activeCard) return;
              await toggleBookmark(activeCard.id);
              showToast(isBookmarked ? '북마크 해제' : '북마크 됨 🔖');
            }}
            className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center"
            aria-label="북마크"
          >
            {isBookmarked ? '🔖' : '📑'}
          </button>
          <button
            onClick={() => {
              setNoteDraft(currentNote);
              setNoteOpen(true);
            }}
            className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center"
            aria-label="메모"
          >
            📝
          </button>
        </div>
      </header>

      <div className="px-5 pb-3">
        <h2 className="font-semibold">
          {lesson.title}{' '}
          <span className="text-text-muted text-sm font-normal">— {lesson.subtitle}</span>
        </h2>
      </div>

      <CardSwiper
        ref={swiperRef}
        cards={lesson.cards}
        initialIndex={resumeIndex}
        onCardEnter={handleCardEnter}
        onChange={setCardIndex}
        onFinish={handleSwipeFinish}
      />

      <div className="px-5 py-3 safe-bottom flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            block
            onClick={() => swiperRef.current?.prev()}
            disabled={isFirst}
            aria-label="이전 카드"
          >
            ← 이전
          </Button>
          <Button
            variant="primary"
            block
            onClick={() => swiperRef.current?.next()}
            aria-label={isLast ? '강 종료 퀴즈로' : '다음 카드'}
          >
            {isLast ? '강 종료 퀴즈 →' : '다음 →'}
          </Button>
        </div>
        {!isLast && (
          <button
            type="button"
            onClick={handleSwipeFinish}
            className="text-xs text-text-muted hover:text-text underline-offset-2 hover:underline self-center"
          >
            건너뛰고 퀴즈로
          </button>
        )}
      </div>

      <Sheet open={noteOpen} onClose={() => setNoteOpen(false)} title="메모">
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          rows={5}
          placeholder="이 카드에 대한 메모…"
          className="w-full rounded-xl border-2 border-border bg-surface px-3 py-2 outline-none focus:border-accent resize-none"
        />
        <div className="flex gap-2 mt-3">
          <Button variant="secondary" onClick={() => setNoteOpen(false)}>
            취소
          </Button>
          <Button
            variant="primary"
            block
            onClick={async () => {
              if (activeCard) {
                await saveNote(activeCard.id, noteDraft);
                showToast('메모 저장됨');
              }
              setNoteOpen(false);
            }}
          >
            저장
          </Button>
        </div>
      </Sheet>

      <Sheet open={shadowOpen} onClose={() => setShadowOpen(false)} title="쉐도잉">
        {example && <ShadowingPanel text={example.en} ko={example.ko} />}
      </Sheet>
    </div>
  );
}
