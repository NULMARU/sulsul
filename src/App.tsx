import { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore, applyTheme } from '@/stores/settingsStore';
import { BottomNav } from '@/components/BottomNav';
import { ToastHost } from '@/components/ui/Toast';
import { HomeRoute } from '@/routes/HomeRoute';

const StagesRoute = lazy(() =>
  import('@/routes/StagesRoute').then((m) => ({ default: m.StagesRoute })),
);
const LessonRoute = lazy(() =>
  import('@/routes/LessonRoute').then((m) => ({ default: m.LessonRoute })),
);
const QuizRoute = lazy(() =>
  import('@/routes/QuizRoute').then((m) => ({ default: m.QuizRoute })),
);
const ReviewRoute = lazy(() =>
  import('@/routes/ReviewRoute').then((m) => ({ default: m.ReviewRoute })),
);
const BookmarksRoute = lazy(() =>
  import('@/routes/BookmarksRoute').then((m) => ({ default: m.BookmarksRoute })),
);
const SettingsRoute = lazy(() =>
  import('@/routes/SettingsRoute').then((m) => ({ default: m.SettingsRoute })),
);

function RouteFallback() {
  return <div className="p-8 text-center text-text-muted">불러오는 중…</div>;
}

function Shell() {
  const location = useLocation();
  const hideNav =
    location.pathname.startsWith('/lesson/') || location.pathname.startsWith('/quiz/');

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto flex flex-col">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/stages" element={<StagesRoute />} />
            <Route path="/lesson/:lessonId" element={<LessonRoute />} />
            <Route path="/quiz/:lessonId" element={<QuizRoute />} />
            <Route path="/review" element={<ReviewRoute />} />
            <Route path="/bookmarks" element={<BookmarksRoute />} />
            <Route path="/settings" element={<SettingsRoute />} />
          </Routes>
        </Suspense>
      </main>
      {!hideNav && <BottomNav />}
      <ToastHost />
    </div>
  );
}

export function App() {
  const hydrate = useProgressStore((s) => s.hydrate);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const fontSize = useSettingsStore((s) => s.fontSize);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    applyTheme(darkMode, fontSize);
    if (darkMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => applyTheme('system', fontSize);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    return undefined;
  }, [darkMode, fontSize]);

  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
