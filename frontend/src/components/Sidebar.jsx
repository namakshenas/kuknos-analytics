import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { navItems } from '../config/navigation';
import { cn } from '../utils/cn';

/**
 * Navigation. Docked to the inline-start edge, which is the right-hand side
 * in this RTL app.
 *
 * Two modes from one markup tree:
 *  - below `lg` it is an off-canvas drawer over a scrim, because at 375px a
 *    240px in-flow sidebar left roughly 111px for the content;
 *  - at `lg` and up it returns to the flex flow and collapses to icons.
 */
export default function Sidebar({ collapsed, toggleCollapsed, mobileOpen, closeMobile }) {
  const location = useLocation();

  return (
    <>
      {/* Scrim — opacity is high enough to clearly separate the drawer
          (skill rule `scrim-and-modal-legibility`). */}
      <div
        onClick={closeMobile}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-30 bg-content/40 transition-opacity duration-base lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'z-40 flex flex-col border-s border-border bg-surface',
          // Mobile: fixed drawer, slid out of view when closed.
          'fixed inset-y-0 start-0 w-sidebar shadow-2xl',
          'transition-transform duration-slow ease-out',
          // Both states are `max-lg:` scoped, for two reasons: pairing a plain
          // `translate-x-full` with `lg:translate-x-0` let the lg rule win the
          // cascade below its own breakpoint (drawer stuck on screen), and
          // leaving the open state with no transform at all gave the
          // transition nothing to interpolate to (drawer stuck off screen).
          mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full',
          // Desktop: back in the flow, sticky under the header, width animates.
          'lg:sticky lg:top-header lg:h-[calc(100dvh-var(--header-height))]',
          'lg:shadow-none lg:transition-[width]',
          collapsed ? 'lg:w-sidebar-collapsed' : 'lg:w-sidebar'
        )}
      >
        <div className="flex h-header shrink-0 items-center justify-between border-b border-border px-3">
          <span className={cn('text-sm font-semibold text-content-muted', collapsed && 'lg:hidden')}>
            منو
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
            aria-expanded={!collapsed}
            className="hidden rounded-lg p-2 text-content-muted transition-colors duration-fast hover:bg-surface-hover lg:block"
          >
            <ChevronRight
              size={18}
              aria-hidden="true"
              className={cn('transition-transform duration-slow ease-out', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="ناوبری اصلی">
          {navItems.map((item) => {
            const { key, label, path } = item;
            const Icon = item.icon;
            const isActive = location.pathname === path;
            return (
              <Link
                key={key}
                to={path}
                onClick={closeMobile}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                  'transition-colors duration-fast',
                  collapsed && 'lg:justify-center lg:px-0',
                  isActive
                    ? 'bg-primary-soft font-semibold text-primary'
                    : 'text-content-muted hover:bg-surface-hover hover:text-content'
                )}
              >
                {/* Position, not just colour, marks the current page */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-primary"
                  />
                )}
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
