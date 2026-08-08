import {
  formatNumber,
  formatRial,
  formatPercent,
  formatDecimal,
  formatCompactNumber,
  formatCompactRial,
} from '../utils/formatters';
import { Card, Skeleton } from './ui';

const FORMATTERS = {
  rial: formatRial,
  percent: formatPercent,
  decimal: formatDecimal,
  number: formatNumber,
};

/**
 * Counts and money get condensed — those are the two formats that run to ten
 * digits and more. Percentages and 2-decimal averages are already short, so
 * they keep their exact rendering.
 */
const COMPACT_FORMATTERS = {
  rial: formatCompactRial,
  number: formatCompactNumber,
};

/**
 * A single metric. `lazy` covers the progressively-loaded fee KPI, which
 * arrives after the main batch.
 */
export default function KPICard({ label, value, format, icon: Icon, lazy }) {
  const formatValue = FORMATTERS[format] ?? formatNumber;
  const formatCompact = COMPACT_FORMATTERS[format] ?? formatValue;
  // The card shows the condensed figure; the exact one stays one hover away.
  const exact = formatValue(value);

  return (
    <Card padding="sm" className="transition-shadow duration-base hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-sm text-content-muted">{label}</p>
          {lazy ? (
            <Skeleton className="h-7 w-2/3" />
          ) : (
            <p className="truncate text-2xl font-bold text-content" title={exact}>
              {formatCompact(value)}
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
