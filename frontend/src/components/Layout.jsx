import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import DbStatus from './DbStatus';

const COLLAPSE_KEY = 'kuknos.sidebar.collapsed';

/** Collapse state survives reloads and navigation — it used to reset every time. */
function useStoredCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* private mode / storage disabled — a non-persisted sidebar is fine */
    }
  }, [collapsed]);

  return [collapsed, setCollapsed];
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useStoredCollapse();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Escape closes the drawer (skill rule `modal-escape`). Navigation closes it
  // via each link's own onClick, so no route-watching effect is needed.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-50 flex h-header items-center gap-3 border-b border-border bg-surface px-4 sm:px-5">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="نمایش منو"
          aria-expanded={mobileOpen}
          className="-ms-2 rounded-lg p-2 text-content-muted transition-colors duration-fast hover:bg-surface-hover lg:hidden"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        {/* Home link. The logo is decorative (alt="") because the adjacent
            title already names the link. */}
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity duration-fast hover:opacity-80"
        >
          <img
            src="/kuknos_co_logo.jpeg"
            alt=""
            width="28"
            height="28"
            className="h-7 w-7 shrink-0 rounded-md object-contain"
          />
          <h1 className="truncate text-lg font-bold text-content">ققنوس آنالیتیکس</h1>
        </Link>

        <div className="ms-auto">
          <DbStatus />
        </div>
      </header>

      <div className="flex items-start">
        <Sidebar
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          closeMobile={() => setMobileOpen(false)}
        />

        {/* min-w-0 lets the wide pending-refunds table scroll inside the grid
            instead of stretching the page (skill rule `horizontal-scroll`). */}
        <main className="min-w-0 flex-1 p-4 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
