import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3 } from 'lucide-react';
import { baseOption } from '../utils/chartTheme';
import { Card, Skeleton, EmptyState, ErrorState } from './ui';

/**
 * Recursive merge for ECharts options.
 *
 * The previous implementation hand-spread exactly five keys
 * (textStyle/tooltip/grid/xAxis/yAxis) which meant `series`, `legend`,
 * `color`, `dataZoom` and `aria` could never carry a default, an array-form
 * `xAxis` was silently corrupted into an object, and a missing `option`
 * threw. Arrays replace wholesale here — element-wise merging is wrong for
 * `series` and for multi-axis charts.
 */
function mergeOption(base, override) {
  if (!override) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const prev = out[key];
    const bothPlainObjects =
      prev && value &&
      typeof prev === 'object' && typeof value === 'object' &&
      !Array.isArray(prev) && !Array.isArray(value);
    out[key] = bothPlainObjects ? mergeOption(prev, value) : value;
  }
  return out;
}

/** True when every series is present but empty — a blank chart frame. */
function hasNoData(option) {
  const series = option?.series;
  if (!Array.isArray(series) || series.length === 0) return false;
  return series.every((s) => Array.isArray(s?.data) && s.data.length === 0);
}

export default function ChartCard({
  title,
  option,
  loading,
  error,
  onRetry,
  height = 300,
  footer,
}) {
  const merged = useMemo(
    () => (option ? mergeOption(baseOption(), option) : null),
    [option]
  );

  // The title renders in every state, so the heading never pops in late and
  // the card's height is identical throughout (skill rule `content-jumping`).
  const header = <h3 className="mb-3 text-base font-semibold text-content">{title}</h3>;

  if (loading) {
    return (
      <Card>
        {header}
        <Skeleton className="w-full" style={{ height }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {header}
        <div className="flex items-center" style={{ height }}>
          <ErrorState
            message="خطا در بارگذاری نمودار"
            onRetry={onRetry}
            className="w-full border-0 bg-transparent shadow-none"
          />
        </div>
      </Card>
    );
  }

  if (!merged || hasNoData(merged)) {
    return (
      <Card>
        {header}
        <div className="flex items-center justify-center" style={{ height }}>
          <EmptyState
            icon={BarChart3}
            message="داده‌ای برای این بازه وجود ندارد"
            hint="بازه زمانی یا توکن دیگری را انتخاب کنید"
            className="py-0"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <ReactECharts
        option={merged}
        style={{ height }}
        opts={{ renderer: 'svg' }}
        notMerge
      />
      {footer && <div className="mt-2 text-xs text-content-subtle">{footer}</div>}
    </Card>
  );
}
