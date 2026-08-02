import { useState } from 'react';
import KPICard, { KPICardSkeleton } from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DateFilter from '../components/DateFilter';
import { getDefaultDateRange } from '../utils/dateRange';
import TokenFilter from '../components/TokenFilter';
import { ErrorState, PageHeader } from '../components/ui';
import { useAnalytics } from '../hooks/useAnalytics';
import { chartColors, preset, withZoom } from '../utils/chartTheme';
import { toJalali, toJalaliMonth, formatNumber } from '../utils/formatters';
import { DEFAULT_TOKEN } from '../utils/tokens';

const ENDPOINTS = {
  kpis: '/refunds/kpis',
  dailyCount: '/refunds/daily-count',
  monthlyTrend: '/refunds/monthly-trend',
  rateTrend: '/refunds/rate-trend',
  candlestick: '/refunds/rate-candlestick',
  statusDist: '/refunds/status-distribution',
  byBank: '/refunds/by-bank',
  amountDist: '/refunds/amount-distribution',
};

const KPI_COUNT = 9;

export default function Refunds() {
  const defaults = getDefaultDateRange();
  const [range, setRange] = useState({
    start_date: defaults.gregorianStart,
    end_date: defaults.gregorianEnd,
  });
  const [token, setToken] = useState(DEFAULT_TOKEN);

  /* Chart titles name the token as well, matching the KPI labels the API
     returns — so no card on this page is ambiguous on its own. */
  const withToken = (title) => `${title} (${token})`;

  const { data, errors, loading, fatalError, refetch } = useAnalytics(ENDPOINTS, {
    ...range,
    token,
  });

  const kpis = data.kpis?.kpis ?? [];
  const dailyCount = data.dailyCount?.series ?? [];
  const monthlyTrend = data.monthlyTrend?.series ?? [];
  const rateTrend = data.rateTrend?.series ?? [];
  const candlestick = data.candlestick?.series ?? [];
  const statusDist = data.statusDist?.data ?? [];
  const byBank = data.byBank?.data ?? [];
  const amountDist = data.amountDist?.data ?? [];

  return (
    <div>
      <PageHeader title="بازخریدها" />

      <DateFilter onApply={(start_date, end_date) => setRange({ start_date, end_date })}>
        <TokenFilter value={token} onChange={setToken} />
      </DateFilter>

      {/* Everything failed — almost certainly the DB or API, so say it once. */}
      {fatalError && <ErrorState message={fatalError} onRetry={refetch} className="mb-5" />}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: KPI_COUNT }, (_, i) => <KPICardSkeleton key={i} />)
          : kpis.map(({ key, ...kpi }) => <KPICard key={key} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title={withToken("نرخ بازخرید روزانه")}
          loading={loading}
          error={errors.candlestick}
          onRetry={refetch}
          option={withZoom({
            ...preset.candlestick({
              name: 'نرخ بازخرید',
              categories: candlestick.map((d) => toJalali(d.date)),
              data: candlestick.map((d) => [d.open, d.close, d.low, d.high]),
            }),
            tooltip: {
              trigger: 'axis',
              formatter: (params) => {
                const p = Array.isArray(params) ? params[0] : params;
                if (!p?.value) return '';
                const [, open, close, low, high] = p.value;
                return `${p.axisValue}<br/>
                  باز: <b>${formatNumber(open)}</b><br/>
                  بسته: <b>${formatNumber(close)}</b><br/>
                  کمترین: <b>${formatNumber(low)}</b><br/>
                  بیشترین: <b>${formatNumber(high)}</b>`;
              },
            },
          })}
        />

        <ChartCard
          title={withToken("تعداد بازخریدها در روز")}
          loading={loading}
          error={errors.dailyCount}
          onRetry={refetch}
          option={withZoom(
            preset.line({
              name: 'تعداد',
              categories: dailyCount.map((d) => toJalali(d.date)),
              data: dailyCount.map((d) => d.value),
              color: chartColors[0],
              area: true,
            })
          )}
        />

        <ChartCard
          title={withToken("روند ماهانه بازخریدها")}
          loading={loading}
          error={errors.monthlyTrend}
          onRetry={refetch}
          option={preset.bar({
            name: 'تعداد',
            categories: monthlyTrend.map((d) => toJalaliMonth(d.date)),
            data: monthlyTrend.map((d) => d.count),
            color: chartColors[1],
          })}
        />

        <ChartCard
          title={withToken("توزیع وضعیت بازخریدها")}
          loading={loading}
          error={errors.statusDist}
          onRetry={refetch}
          option={preset.pie({ name: 'وضعیت', data: statusDist })}
        />

        <ChartCard
          title={withToken("توزیع بازخریدها براساس بانک")}
          loading={loading}
          error={errors.byBank}
          onRetry={refetch}
          option={preset.bar({
            name: 'تعداد',
            categories: byBank.map((b) => b.name),
            data: byBank.map((b) => b.count),
            color: chartColors[2],
          })}
        />

        <ChartCard
          title={withToken("توزیع مقدار بازخرید")}
          loading={loading}
          error={errors.amountDist}
          onRetry={refetch}
          option={preset.bar({
            name: 'تعداد',
            categories: amountDist.map((a) => a.name),
            data: amountDist.map((a) => a.value),
            color: chartColors[3],
          })}
        />

        <ChartCard
          title={withToken("روند نرخ بازخرید")}
          loading={loading}
          error={errors.rateTrend}
          onRetry={refetch}
          option={withZoom(
            preset.line({
              name: 'نرخ میانگین',
              categories: rateTrend.map((d) => toJalali(d.date)),
              data: rateTrend.map((d) => d.value),
              color: chartColors[6],
            })
          )}
        />
      </div>
    </div>
  );
}
