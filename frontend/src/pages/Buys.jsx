import { useEffect, useState } from 'react';
import client from '../api/client';
import KPICard, { KPICardSkeleton } from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DateFilter from '../components/DateFilter';
import { getDefaultDateRange } from '../utils/dateRange';
import TokenFilter from '../components/TokenFilter';
import { ErrorState, PageHeader } from '../components/ui';
import { useAnalytics } from '../hooks/useAnalytics';
import { chartColors, preset, withZoom } from '../utils/chartTheme';
import { toJalali } from '../utils/formatters';
import { DEFAULT_TOKEN } from '../utils/tokens';

const ENDPOINTS = {
  kpis: '/buys/kpis',
  dailyCount: '/buys/daily-count',
  dailyVolume: '/buys/daily-volume',
  monthlyTrend: '/buys/monthly-trend',
  exchangeRate: '/buys/exchange-rate-trend',
  byGateway: '/buys/by-gateway',
  byApplication: '/buys/by-application',
  amountDist: '/buys/amount-distribution',
};

const KPI_COUNT = 6;

export default function Buys() {
  const defaults = getDefaultDateRange();
  const [range, setRange] = useState({
    start_date: defaults.gregorianStart,
    end_date: defaults.gregorianEnd,
  });
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [fee, setFee] = useState({ key: null, kpi: null });

  /* Chart titles name the token as well, matching the KPI labels the API
     returns — so no card on this page is ambiguous on its own. */
  const withToken = (title) => `${title} (${token})`;

  const params = { ...range, token };
  const paramsKey = JSON.stringify(params);
  const { data, errors, loading, fatalError, refetch } = useAnalytics(ENDPOINTS, params);

  const kpis = data.kpis?.kpis ?? [];
  const hasFeeKpi = kpis.some((k) => k.key === 'total_buys_fee');

  /*
   * The fee KPI is expensive — it matches every transaction against a
   * minute-resolution price series — so it loads on its own and patches
   * itself in. Only tokens with a fee price series expose the card at all.
   *
   * The `loading` guard matters: while a new token's KPIs are in flight the
   * hook still serves the previous token's list, so `hasFeeKpi` would be
   * stale-true and we'd request a fee for a token that has none (HTTP 400).
   */
  useEffect(() => {
    if (loading || !hasFeeKpi) return;
    const controller = new AbortController();
    client
      .get('/buys/total-fee', { params: JSON.parse(paramsKey), signal: controller.signal })
      .then((res) => setFee({ key: paramsKey, kpi: res.data.kpi }))
      .catch((err) => {
        if (!controller.signal.aborted) console.error('Error fetching buys fee:', err.message);
      });
    return () => controller.abort();
  }, [loading, hasFeeKpi, paramsKey]);

  // Keyed by params, so a fee fetched for a different token or date range is
  // never shown against the current one.
  const currentFee = fee.key === paramsKey ? fee.kpi : null;
  const resolvedKpis = kpis.map((kpi) =>
    kpi.key === 'total_buys_fee' && currentFee ? { ...kpi, ...currentFee, lazy: false } : kpi
  );

  const dailyCount = data.dailyCount?.series ?? [];
  const dailyVolume = data.dailyVolume?.series ?? [];
  const byGateway = data.byGateway?.data ?? [];
  const byApplication = data.byApplication?.data ?? [];
  const amountDist = data.amountDist?.data ?? [];
  const exchangeRate = data.exchangeRate?.series ?? [];

  return (
    <div>
      <PageHeader title="فروش / پرداخت‌ها" />

      <DateFilter onApply={(start_date, end_date) => setRange({ start_date, end_date })}>
        <TokenFilter value={token} onChange={setToken} />
      </DateFilter>

      {fatalError && <ErrorState message={fatalError} onRetry={refetch} className="mb-5" />}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: KPI_COUNT }, (_, i) => <KPICardSkeleton key={i} />)
          : resolvedKpis.map(({ key, ...kpi }) => <KPICard key={key} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title={withToken("حجم خریداری شده در روز")}
          loading={loading}
          error={errors.dailyCount}
          onRetry={refetch}
          option={withZoom(
            preset.line({
              name: `حجم ${token}`,
              categories: dailyCount.map((d) => toJalali(d.date)),
              data: dailyCount.map((d) => d.value),
              color: chartColors[0],
              area: true,
            })
          )}
        />

        {/* "حجم ریالی" rather than "(ریال)": the token suffix would otherwise
            produce two parenthesised groups in a row. */}
        <ChartCard
          title={withToken("حجم ریالی خرید روزانه")}
          loading={loading}
          error={errors.dailyVolume}
          onRetry={refetch}
          option={withZoom(
            preset.line({
              name: 'حجم (ریال)',
              categories: dailyVolume.map((d) => toJalali(d.date)),
              data: dailyVolume.map((d) => d.value),
              color: chartColors[1],
              area: true,
            })
          )}
        />

        <ChartCard
          title={withToken("روند نرخ خرید")}
          loading={loading}
          error={errors.exchangeRate}
          onRetry={refetch}
          option={withZoom(
            preset.line({
              name: 'نرخ میانگین',
              categories: exchangeRate.map((d) => toJalali(d.date)),
              data: exchangeRate.map((d) => d.value),
              color: chartColors[6],
            })
          )}
        />

        <ChartCard
          title={withToken("توزیع براساس درگاه پرداخت")}
          loading={loading}
          error={errors.byGateway}
          onRetry={refetch}
          option={preset.pie({
            name: 'درگاه',
            data: byGateway.map((g) => ({ name: g.name, value: g.count })),
          })}
        />

        <ChartCard
          title={withToken("توزیع براساس اپلیکیشن")}
          loading={loading}
          error={errors.byApplication}
          onRetry={refetch}
          option={preset.bar({
            name: 'تعداد',
            categories: byApplication.map((a) => a.name),
            data: byApplication.map((a) => a.value),
            color: chartColors[2],
          })}
        />

        <ChartCard
          title={withToken("توزیع مقدار خرید")}
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
      </div>
    </div>
  );
}
