import { useState } from 'react';
import KPICard, { KPICardSkeleton } from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DateFilter from '../components/DateFilter';
import { getDefaultDateRange } from '../utils/dateRange';
import PendingUsersTable from '../components/PendingUsersTable';
import { ErrorState, PageHeader } from '../components/ui';
import { useAnalytics } from '../hooks/useAnalytics';
import { chartColors, preset } from '../utils/chartTheme';
import { toJalaliMonth } from '../utils/formatters';

const ENDPOINTS = {
  kpis: '/users/kpis',
  newPerMonth: '/users/new-per-month',
  topBuyers: '/users/top-buyers',
  topSellers: '/users/top-sellers',
  activityDist: '/users/activity-distribution',
  monthlyActive: '/users/monthly-active',
  buySellComparison: '/users/buy-sell-comparison',
};

const KPI_COUNT = 2;

/** Rank labels for the top-10 charts (Persian digits, highest at the top). */
const rankLabels = (rows) => rows.map((_, i) => `#${i + 1}`).reverse();

export default function UserAnalytics() {
  const defaults = getDefaultDateRange();
  const [range, setRange] = useState({
    start_date: defaults.gregorianStart,
    end_date: defaults.gregorianEnd,
  });

  const { data, errors, loading, fatalError, refetch } = useAnalytics(ENDPOINTS, range);

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

      <DateFilter onApply={(start_date, end_date) => setRange({ start_date, end_date })} />

      {fatalError && <ErrorState message={fatalError} onRetry={refetch} className="mb-5" />}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: KPI_COUNT }, (_, i) => <KPICardSkeleton key={i} />)
          : kpis.map(({ key, ...kpi }) => <KPICard key={key} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="کاربران جدید در هر ماه"
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
          title="کاربران فعال ماهانه"
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
          title="توزیع فعالیت کاربران"
          loading={loading}
          error={errors.activityDist}
          onRetry={refetch}
          option={preset.pie({ name: 'تعداد تراکنش', data: activityDist })}
        />

        <ChartCard
          title="مقایسه حجم خرید و فروش"
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
          title="۱۰ خریدار برتر"
          loading={loading}
          error={errors.topBuyers}
          onRetry={refetch}
          option={preset.barHorizontal({
            name: 'حجم خرید',
            categories: rankLabels(topBuyers),
            data: topBuyers.map((b) => b.total_amount).reverse(),
            color: chartColors[2],
          })}
        />

        <ChartCard
          title="۱۰ فروشنده برتر"
          loading={loading}
          error={errors.topSellers}
          onRetry={refetch}
          option={preset.barHorizontal({
            name: 'حجم فروش',
            categories: rankLabels(topSellers),
            data: topSellers.map((s) => s.total_amount).reverse(),
            color: chartColors[5],
          })}
        />
      </div>

      <PendingUsersTable />
    </div>
  );
}
