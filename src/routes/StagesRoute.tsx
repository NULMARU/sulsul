import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStages, listLessonIds } from '@/lib/content';
import type { Stage } from '@/types/content';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Progress } from '@/components/ui/Progress';

interface LessonHeading {
  lessonId: string;
  order: number;
}

export function StagesRoute() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const lessons = useProgressStore((s) => s.lessons);
  const unlockAll = useSettingsStore((s) => s.unlockAllStages);
  const availableLessonIds = listLessonIds();

  useEffect(() => {
    loadStages().then((s) => {
      setStages(s);
      setOpenId(s[0]?.id ?? null);
    });
  }, []);

  const stageProgress = (s: Stage) => {
    const total = s.lessonIds.length;
    const done = s.lessonIds.filter((id) => lessons[id]?.completed).length;
    return total > 0 ? done / total : 0;
  };

  const isUnlocked = (s: Stage, idx: number) => {
    if (unlockAll) return true;
    if (idx === 0) return true;
    const prev = stages[idx - 1];
    if (!prev) return true;
    return stageProgress(prev) >= s.unlockThreshold;
  };

  return (
    <div className="px-5 pt-6 pb-6 max-w-card mx-auto w-full flex flex-col gap-4">
      <h1 className="text-2xl font-bold">학습 단계</h1>
      {stages.map((s, idx) => {
        const unlocked = isUnlocked(s, idx);
        const pct = stageProgress(s);
        const open = openId === s.id;
        const headings: LessonHeading[] = s.lessonIds.map((id, i) => ({
          lessonId: id,
          order: i + 1,
        }));
        return (
          <section
            key={s.id}
            className={`rounded-2xl border p-4 transition-all ${
              unlocked
                ? 'bg-surface border-border'
                : 'bg-surface-2 border-border opacity-60'
            }`}
          >
            <button
              className="w-full text-left"
              onClick={() => setOpenId(open ? null : s.id)}
              disabled={!unlocked}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {s.title} {!unlocked && '🔒'}
                  </div>
                  <div className="text-sm text-text-muted mt-0.5">{s.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-muted">{s.lessonIds.length}강</div>
                  <div className="text-sm font-medium">{Math.round(pct * 100)}%</div>
                </div>
              </div>
              <div className="mt-3">
                <Progress value={pct} />
              </div>
            </button>

            {open && unlocked && (
              <>
                <ul className="mt-4 flex flex-col divide-y divide-border">
                  {headings.map((h) => {
                    const exists = availableLessonIds.includes(h.lessonId);
                    const lp = lessons[h.lessonId];
                    const status = lp?.completed
                      ? '✓'
                      : lp && lp.lastViewedCardOrder > 0
                        ? '▶'
                        : '○';
                    return (
                      <li key={h.lessonId}>
                        <button
                          disabled={!exists}
                          onClick={() => navigate(`/lesson/${h.lessonId}`)}
                          className={`w-full flex items-center gap-3 py-3 text-left ${
                            exists ? '' : 'opacity-50'
                          }`}
                        >
                          <span className="w-6 text-center text-text-muted">{status}</span>
                          <span className="flex-1">
                            {h.lessonId.replace('lesson-', '')}강{' '}
                            {!exists && (
                              <span className="text-xs text-text-muted ml-1">(준비 중)</span>
                            )}
                          </span>
                          <span className="text-text-muted">→</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {s.bossQuizId && (
                  <button
                    onClick={() => navigate(`/quiz/${s.bossQuizId}`)}
                    disabled={!unlockAll && pct < 1}
                    className={`mt-3 w-full rounded-xl border-2 px-4 py-3 font-medium transition-all ${
                      unlockAll || pct >= 1
                        ? 'bg-accent/15 border-accent text-text active:scale-[0.99]'
                        : 'bg-surface-2 border-border text-text-muted opacity-60'
                    }`}
                  >
                    👑 Stage Boss 퀴즈
                    {!unlockAll && pct < 1 && (
                      <span className="text-xs ml-2">(모든 강 완료 시 해금)</span>
                    )}
                  </button>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
