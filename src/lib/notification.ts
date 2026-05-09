// Lightweight notification helper.
// Strategy: at app open, if it's been past the user's reminder time and there are due quizzes,
// show a toast. If browser permission is granted, also fire a system notification.

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function getPermission(): NotifPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotifPermission;
}

export async function requestPermission(): Promise<NotifPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission as NotifPermission;
  }
  try {
    const result = await Notification.requestPermission();
    return result as NotifPermission;
  } catch {
    return 'denied';
  }
}

export function fireSystemNotification(title: string, body: string) {
  if (getPermission() !== 'granted') return;
  try {
    new Notification(title, { body, badge: '/icons/icon-192.png', icon: '/icons/icon-192.png' });
  } catch {
    // Some browsers (Safari mobile) need ServiceWorkerRegistration.showNotification.
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, { body }))
        .catch(() => undefined);
    }
  }
}

const LAST_REMINDER_KEY = 'sulsul-last-reminder-shown';

export function shouldShowReminderToday(notificationTime: string): boolean {
  if (typeof window === 'undefined') return false;
  const last = window.localStorage.getItem(LAST_REMINDER_KEY);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  if (last === todayKey) return false;

  const [hStr, mStr] = notificationTime.split(':');
  const h = Number(hStr ?? 21);
  const m = Number(mStr ?? 0);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return today.getTime() >= target.getTime();
}

export function markReminderShown() {
  if (typeof window === 'undefined') return;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  window.localStorage.setItem(LAST_REMINDER_KEY, todayKey);
}
