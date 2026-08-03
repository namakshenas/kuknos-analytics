import { useState } from 'react';
import KPICard, { KPICardSkeleton } from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DateFilter from '../components/DateFilter';
import { getDefaultDateRange } from '../utils/dateRange';
import PendingUsersTable from '../components/PendingUsersTable';
import TokenFilter from '../components/TokenFilter';
import { ErrorState, PageHeader } from '../components/ui';
import { useAnalytics } from '../hooks/useAnalytics';
import { chartColors, preset } from '../utils/chartTheme';
import { toJalaliMonth, shortWallet } from '../utils/formatters';
import { DEFAULT_TOKEN } from '../utils/tokens';

const ENDPOINTS = {
  kpis: '/users/kpis',
  newPerMonth: '/users/new-per-month',
  topBuyers: '/users/top-buyers',
  topSellers: '/users/top-sellers',
  activityDist: '/users/activity-distribution',
  monthlyActive: '/users/monthly-active',
  buySellComparison: '/users/buy-sell-comparison',
};

const KPI_COUNT = 4;

/**
 * Build every array a top-10 chart needs from one ordering, so the bars,
 * the rank labels and the tooltip identities cannot drift apart.
 *
 * The rows arrive ranked best-first; a category axis draws index 0 at the
 * bottom, so they're reversed once here to put #1 at the top.
 */
function topRanking(rows) {
  const ordered = [...rows].reverse();
  const n = ordered.length;
  return {
    categories: ordered.map((_, i) => `#${n - i}`),
    data: ordered.map((r) => r.total_amount),
    // The account holder's name is the point of the tooltip; wallets that have
    // no identity record fall back to a shortened address.
    rowLabels: ordered.map((r) => r.name || shortWallet(r.wallet)),
    rowSubLabels: ordered.map((r) => (r.name ? shortWallet(r.wallet) : null)),
    rowMeta: ordered.map((r) => r.tx_count),
  };
}

export default function UserAnalytics() {
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
  const newPerMonth = data.newPerMonth?.series ?? [];
  const monthlyActive = data.monthlyActive?.series ?? [];
  const activityDist = data.activityDist?.data ?? [];
  const buySell = data.buySellComparison?.series ?? [];
  const topBuyers = data.topBuyers?.data ?? [];
  const topSellers = data.topSellers?.data ?? [];

  return (
    <div>
      <PageHeader title="تحلیل کاربران" />

      <DateFilter onApply={(start_date, end_date) => setRange({ start_date, end_date })}>
        <TokenFilter value={token} onChange={setToken} />
      </DateFilter>

      {fatalError && <ErrorState message={fatalError} onRetry={refetch} className="mb-5" />}

      {/* Four across at xl, so the set reads as one row: total = buyers +
          sellers − both. A 3-column grid would orphan the fourth card. */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: KPI_COUNT }, (_, i) => <KPICardSkeleton key={i} />)
          : kpis.map(({ key, ...kpi }) => <KPICard key={key} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title={withToken("کاربران جدید در هر ماه")}
          loading={loading}
          error={errors.newPerMonth}
          onRetry={refetch}
          option={preset.line({
            name: 'کاربران جدید',
            categories: newPerMonth.map((d) => toJalaliMonth(d.date)),
            data: newPerMonth.map((d) => d.value),
            color: chartColors[0],
            area: true,
          })}
        />

        <ChartCard
          title={withToken("کاربران فعال ماهانه")}
          loading={loading}
          error={errors.monthlyActive}
          onRetry={refetch}
          option={preset.bar({
            name: 'کاربران فعال',
            categories: monthlyActive.map((d) => toJalaliMonth(d.date)),
            data: monthlyActive.map((d) => d.value),
            color: chartColors[1],
          })}
        />

        <ChartCard
          title={withToken("توزیع فعالیت کاربران")}
          loading={loading}
          error={errors.activityDist}
          onRetry={refetch}
          option={preset.pie({ name: 'تعداد تراکنش', data: activityDist })}
        />

        <ChartCard
          title={withToken("مقایسه حجم خرید و فروش")}
          loading={loading}
          error={errors.buySellComparison}
          onRetry={refetch}
          option={preset.multiLine({
            categories: buySell.map((d) => toJalaliMonth(d.month)),
            series: [
              { name: 'خرید', data: buySell.map((d) => d.buy_amount), color: chartColors[2] },
              { name: 'فروش', data: buySell.map((d) => d.sell_amount), color: chartColors[4] },
            ],
          })}
        />

        <ChartCard
          title={withToken("۱۰ خریدار برتر")}
          loading={loading}
          error={errors.topBuyers}
          onRetry={refetch}
          option={preset.barHorizontal({
            name: 'حجم خرید',
            color: chartColors[2],
            metaLabel: 'تعداد خرید',
            ...topRanking(topBuyers),
          })}
        />

        <ChartCard
          title={withToken("۱۰ فروشنده برتر")}
          loading={loading}
          error={errors.topSellers}
          onRetry={refetch}
          option={preset.barHorizontal({
            name: 'حجم فروش',
            color: chartColors[5],
            metaLabel: 'تعداد بازخرید',
            ...topRanking(topSellers),
          })}
        />
      </div>

      <PendingUsersTable />
    </div>
  );
}
