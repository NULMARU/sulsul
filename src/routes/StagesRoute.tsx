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
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const lessons = useProgressStore((s) => s.lessons);
  const unlockAll = useSettingsStore((s) => s.unlockAllStages);
  const availableLessonIds = listLessonIds();

  useEffect(() => {
    loadStages().then((s) => {
      setStages(s);
      setOpenIds(new Set(s.map((x) => x.id)));
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

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="px-5 pt-6 pb-6 max-w-card mx-auto w-full flex flex-col gap-4">
      <h1 className="text-2xl font-bold">학습 단계</h1>
      {stages.map((s, idx) => {
        const unlocked = isUnlocked(s, idx);
        const pct = stageProgress(s);
        const open = openIds.has(s.id);
        const headings: LessonHeading[] = s.lessonIds.map((id, i) => ({
          lessonId: id,
          order: i + 1,
        }));
        const firstUnstartedId = s.lessonIds.find(
          (id) => !lessons[id]?.completed && availableLessonIds.includes(id),
        );

        return (
          <section
            key={s.id}
            className={`rounded-2xl border p-4 transition-all ${
              unlocked ? 'bg-surface border-border' : 'bg-surface-2 border-border opacity-60'
            }`}
          >
            <button className="w-full text-left" onClick={() => toggle(s.id)}>
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

            {open && (
              <>
                {!unlocked && (
                  <p className="mt-3 text-xs text-text-muted">
                    🔒 직전 단계 80% 완료 시 자동 해금 · 설정에서 즉시 해금 가능
                  </p>
                )}
                {unlocked && firstUnstartedId && (
                  <button
                    onClick={() => navigate(`/lesson/${firstUnstartedId}`)}
                    className="mt-3 w-full rounded-xl bg-accent text-[#2A2522] font-medium px-4 py-3 active:scale-[0.99] transition-all"
                  >
                    ▶ {firstUnstartedId.replace('lesson-', '')}강부터 시작
                  </button>
                )}
                <ul className="mt-4 flex flex-col divide-y divide-border">
                  {headings.map((h) => {
                    const exists = availableLessonIds.includes(h.lessonId);
                    const lp = lessons[h.lessonId];
                    const status = lp?.completed
                      ? '✓'
                      : lp && lp.lastViewedCardOrder > 0
                        ? '▶'
                        : '○';
                    const lessonClickable = exists && unlocked;
                    return (
                      <li key={h.lessonId}>
                        <button
                          disabled={!lessonClickable}
                          onClick={() => navigate(`/lesson/${h.lessonId}`)}
                          className={`w-full flex items-center gap-3 py-3 text-left ${
                            lessonClickable ? '' : 'opacity-60'
                          }`}
                        >
                          <span className="w-6 text-center text-text-muted">
                            {!unlocked ? '🔒' : status}
                          </span>
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
                    disabled={!unlocked || (!unlockAll && pct < 1)}
                    className={`mt-3 w-full rounded-xl border-2 px-4 py-3 font-medium transition-all ${
                      unlocked && (unlockAll || pct >= 1)
                        ? 'bg-accent/15 border-accent text-text active:scale-[0.99]'
                        : 'bg-surface-2 border-border text-text-muted opacity-60'
                    }`}
                  >
                    👑 Stage Boss 퀴즈
                    {(!unlocked || (!unlockAll && pct < 1)) && (
                      <span className="text-xs ml-2">
                        {!unlocked ? '(단계 잠김)' : '(모든 강 완료 시 해금)'}
                      </span>
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
