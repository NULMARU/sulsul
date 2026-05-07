import type { Lesson, Stage } from '@/types/content';
import type { Quiz } from '@/types/quiz';
import stagesJson from '@/data/stages.json';

const lessonModules = import.meta.glob('@/data/lessons/*.json');
const quizModules = import.meta.glob('@/data/quizzes/*.json');

export async function loadStages(): Promise<Stage[]> {
  return stagesJson as Stage[];
}

export async function loadLesson(id: string): Promise<Lesson | null> {
  const key = Object.keys(lessonModules).find((k) => k.endsWith(`/${id}.json`));
  if (!key) return null;
  const mod = (await lessonModules[key]!()) as { default: Lesson };
  return mod.default;
}

export async function loadQuizzes(lessonId: string): Promise<Quiz[]> {
  const key = Object.keys(quizModules).find((k) => k.endsWith(`/${lessonId}.json`));
  if (!key) return [];
  const mod = (await quizModules[key]!()) as { default: Quiz[] };
  return mod.default;
}

export async function loadAllQuizzes(): Promise<Quiz[]> {
  const all: Quiz[] = [];
  for (const key of Object.keys(quizModules)) {
    const mod = (await quizModules[key]!()) as { default: Quiz[] };
    all.push(...mod.default);
  }
  return all;
}

export function listLessonIds(): string[] {
  return Object.keys(lessonModules)
    .map((k) => {
      const m = k.match(/\/(lesson-\d{2})\.json$/);
      return m ? m[1]! : null;
    })
    .filter((x): x is string => !!x)
    .sort();
}

export function prefetchLesson(id: string): void {
  const key = Object.keys(lessonModules).find((k) => k.endsWith(`/${id}.json`));
  if (!key) return;
  const idle =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (window as Window & { requestIdleCallback?: (cb: () => void) => void })
          .requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200))
      : (cb: () => void) => setTimeout(cb, 200);
  idle(() => {
    void lessonModules[key]!();
  });
}
