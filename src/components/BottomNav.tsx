import { NavLink } from 'react-router-dom';
import { ko } from '@/i18n/ko';

const items = [
  { to: '/', icon: '🏠', label: ko.nav.home },
  { to: '/stages', icon: '📚', label: ko.nav.stages },
  { to: '/review', icon: '🔁', label: ko.nav.review },
  { to: '/bookmarks', icon: '🔖', label: ko.nav.bookmarks },
  { to: '/settings', icon: '⚙️', label: ko.nav.settings },
];

export function BottomNav() {
  return (
    <nav className="border-t border-border bg-surface safe-bottom">
      <ul className="flex">
        {items.map((it) => (
          <li key={it.to} className="flex-1">
            <NavLink
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 transition-colors ${
                  isActive ? 'text-accent-strong' : 'text-text-muted'
                }`
              }
            >
              <span className="text-xl leading-none">{it.icon}</span>
              <span className="text-[11px]">{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
