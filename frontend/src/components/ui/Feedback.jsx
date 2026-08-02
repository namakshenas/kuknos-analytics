import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';
import Card from './Card';

/** Shimmer placeholder. Callers must size it to match the real content. */
export function Skeleton({ className, ...rest }) {
  return <div className={cn('animate-pulse rounded bg-surface-hover', className)} {...rest} />;
}

/**
 * Replaces the error block that was duplicated four times across
 * Buys / Refunds / UserAnalytics / PendingUsersTable.
 *
 * `onRetry` re-runs the fetch with the current filters. The old copies called
 * `window.location.reload()`, which threw away the selected date range and
 * token — skill rule `error-recovery`: the recovery path must not cost the
 * user their work.
 */
export function ErrorState({ message, onRetry, className }) {
  return (
    <Card
      role="alert"
      className={cn('border-danger/30 bg-danger-soft', className)}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-danger font-medium">{message}</p>
          {onRetry && (
            <Button variant="danger" size="sm" icon={RotateCw} onClick={onRetry} className="mt-3">
              تلاش مجدد
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** "No data" state. text-content-subtle is 4.8:1 — the old gray-400 was 2.8:1. */
export function EmptyState({ message = 'داده‌ای یافت نشد', hint, icon, className }) {
  const Icon = icon ?? Inbox;
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
      <Icon size={32} className="text-content-subtle/60" aria-hidden="true" />
      <p className="text-content-muted">{message}</p>
      {hint && <p className="text-sm text-content-subtle">{hint}</p>}
    </div>
  );
}
