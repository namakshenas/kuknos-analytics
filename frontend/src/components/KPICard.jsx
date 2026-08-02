import { formatNumber, formatRial, formatPercent, formatDecimal } from '../utils/formatters';
import { Card, Skeleton } from './ui';

const FORMATTERS = {
  rial: formatRial,
  percent: formatPercent,
  decimal: formatDecimal,
  number: formatNumber,
};

/**
 * A single metric. `lazy` covers the progressively-loaded fee KPI, which
 * arrives after the main batch.
 */
export default function KPICard({ label, value, format, icon: Icon, lazy }) {
  const formatValue = FORMATTERS[format] ?? formatNumber;

  return (
    <Card padding="sm" className="transition-shadow duration-base hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-sm text-content-muted">{label}</p>
          {lazy ? (
            <Skeleton className="h-7 w-2/3" />
          ) : (
            <p className="truncate text-2xl font-bold text-content" title={formatValue(value)}>
              {formatValue(value)}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary-soft p-2 text-primary">
            <Icon size={18} aria-hidden="true" />
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Loading placeholder with the same padding, line count and line heights as
 * the real card — so the swap causes no layout shift. The pages previously
 * inlined their own version that omitted the border, which made every card
 * flicker its outline on load.
 */
export function KPICardSkeleton() {
  return (
    <Card padding="sm">
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="h-7 w-1/2" />
    </Card>
  );
}
