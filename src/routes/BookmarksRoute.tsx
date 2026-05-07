import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '@/stores/progressStore';
import { listLessonIds, loadLesson } from '@/lib/content';
import type { Lesson, Card } from '@/types/content';
import { Button } from '@/components/ui/Button';

interface CardRef {
  card: Card;
  lessonId: string;
  lessonTitle: string;
}

export function BookmarksRoute() {
  const navigate = useNavigate();
  const bookmarks = useProgressStore((s) => s.bookmarks);
  const notes = useProgressStore((s) => s.notes);
  const [refs, setRefs] = useState<CardRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lessonIds = listLessonIds();
      const lessons: Lesson[] = [];
      for (const id of lessonIds) {
        const l = await loadLesson(id);
        if (l) lessons.push(l);
      }
      if (cancelled) return;
      const built: CardRef[] = [];
      for (const id of bookmarks) {
        const lesson = lessons.find((l) => l.cards.some((c) => c.id === id));
        const card = lesson?.cards.find((c) => c.id === id);
        if (lesson && card) {
          built.push({ card, lessonId: lesson.id, lessonTitle: `${lesson.title} — ${lesson.subtitle}` });
        }
      }
      setRefs(built);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookmarks]);

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; items: CardRef[] }>();
    refs.forEach((r) => {
      const g = map.get(r.lessonId) ?? { title: r.lessonTitle, items: [] };
      g.items.push(r);
      map.set(r.lessonId, g);
    });
    return Array.from(map.entries());
  }, [refs]);

  if (refs.length === 0) {
    return (
      <div className="px-6 py-12 text-center max-w-card mx-auto flex flex-col items-center gap-3">
        <div className="text-5xl">🔖</div>
        <p className="text-text-muted">아직 북마크한 카드가 없어요</p>
        <Button variant="secondary" onClick={() => navigate('/stages')}>
          학습으로 가기
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-6 max-w-card mx-auto w-full flex flex-col gap-5">
      <h1 className="text-2xl font-bold">북마크</h1>
      {grouped.map(([lessonId, g]) => (
        <section key={lessonId} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-muted">{g.title}</h2>
          {g.items.map((r) => (
            <button
              key={r.card.id}
              onClick={() => navigate(`/lesson/${r.lessonId}`)}
              className="rounded-2xl bg-surface border border-border p-4 text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-start gap-3">
                {r.card.emoji && <span className="text-2xl">{r.card.emoji}</span>}
                <div className="flex-1 min-w-0">
                  <div className="line-clamp-2 text-sm">{r.card.text}</div>
                  {notes[r.card.id] && (
                    <div className="mt-2 text-xs text-text-muted line-clamp-2 border-l-2 border-accent/50 pl-2">
                      📝 {notes[r.card.id]}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
