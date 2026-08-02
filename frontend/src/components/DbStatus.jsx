import { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import client from '../api/client';

const STATES = {
  checking: { dot: 'bg-content-subtle', label: 'بررسی اتصال…' },
  connected: { dot: 'bg-success', label: 'دیتابیس متصل' },
  offline: { dot: 'bg-danger', label: 'دیتابیس قطع' },
};

export default function DbStatus() {
  const [connected, setConnected] = useState(null); // null = checking

  useEffect(() => {
    const check = () =>
      client
        .get('/health/db')
        .then((r) => setConnected(r.data.connected))
        .catch(() => setConnected(false));

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const state = connected === null ? STATES.checking : connected ? STATES.connected : STATES.offline;

  return (
    // aria-live so a drop is announced rather than silently changing colour;
    // the label carries the meaning, so this isn't colour-only either.
    <div
      className="flex items-center gap-2 rounded-full bg-surface-muted px-2.5 py-1"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75 [animation-duration:1.8s]" />
        )}
        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', state.dot)} />
      </span>
      {/* text-content-subtle is 4.8:1; the previous gray-400 was ~2.8:1 and
          failed WCAG AA for small text. */}
      <span className="hidden text-xs text-content-subtle sm:inline">{state.label}</span>
    </div>
  );
}
