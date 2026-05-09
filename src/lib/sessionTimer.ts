// Tracks active study session time. Pauses when tab hidden / window blurred.

import { useEffect } from 'react';
import { useProgressStore } from '@/stores/progressStore';

const PAUSE_AFTER_IDLE_MS = 60_000;

export function useStudyTimer(active: boolean) {
  const addStudySeconds = useProgressStore((s) => s.addStudySeconds);

  useEffect(() => {
    if (!active) return;

    let lastTickAt = Date.now();
    let totalAccumulatedMs = 0;
    let visible = !document.hidden && document.hasFocus();

    const flush = (force = false) => {
      const seconds = Math.floor(totalAccumulatedMs / 1000);
      if (seconds > 0 || force) {
        if (seconds > 0) {
          void addStudySeconds(seconds);
          totalAccumulatedMs -= seconds * 1000;
        }
      }
    };

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickAt;
      lastTickAt = now;
      if (visible && delta < PAUSE_AFTER_IDLE_MS) {
        totalAccumulatedMs += delta;
      }
      if (totalAccumulatedMs >= 30_000) {
        flush();
      }
    };

    const interval = window.setInterval(tick, 5_000);

    const onVisibility = () => {
      visible = !document.hidden && document.hasFocus();
      lastTickAt = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    window.addEventListener('blur', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      window.removeEventListener('blur', onVisibility);
      flush(true);
    };
  }, [active, addStudySeconds]);
}
