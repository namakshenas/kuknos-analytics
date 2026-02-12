import React, { useState, useEffect } from 'react';
import client from '../api/client';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { chartColors } from '../utils/chartDefaults';
import { toJalaliMonth } from '../utils/formatters';

/**
 * User Analytics page
 */
export default function UserAnalytics() {
  const [kpis, setKpis] = useState([]);
  const [newPerMonth, setNewPerMonth] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [activityDist, setActivityDist] = useState([]);
  const [monthlyActive, setMonthlyActive] = useState([]);
  const [buySellComparison, setBuySellComparison] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [kpisRes, newRes, buyersRes, sellersRes, activityRes, activeRes, comparisonRes] =
          await Promise.all([
            client.get('/users/kpis'),
            client.get('/users/new-per-month'),
            client.get('/users/top-buyers'),
            client.get('/users/top-sellers'),
            client.get('/users/activity-distribution'),
            client.get('/users/monthly-active'),
            client.get('/users/buy-sell-comparison'),
          ]);

        setKpis(kpisRes.data.kpis);
        setNewPerMonth(newRes.data.series);
        setTopBuyers(buyersRes.data.data);
        setTopSellers(sellersRes.data.data);
        setActivityDist(activityRes.data.data);
        setMonthlyActive(activeRes.data.series);
        setBuySellComparison(comparisonRes.data.series);
      } catch (err) {
        console.error('Error fetching user analytics data:', err);
        if (err.response?.status === 503) {
          setError('خطا در اتصال به پایگاه داده. لطفاً اتصال VPN را بررسی کنید.');
        } else {
          setError('خطا در دریافت اطلاعات');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">تحلیل کاربران</h2>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {loading
          ? Array(2)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
          : kpis.map((kpi) => <KPICard key={kpi.key} {...kpi} />)}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Users Per Month */}
        <ChartCard
          title="کاربران جدید در هر ماه"
          loading={loading}
          option={{
            xAxis: {
              type: 'category',
              data: newPerMonth.map((d) => toJalaliMonth(d.date)),
              
            },
            yAxis: { type: 'value' },
            series: [
              {
                name: 'کاربران جدید',
                type: 'line',
                data: newPerMonth.map((d) => d.value),
                color: chartColors[0],
                smooth: true,
                areaStyle: { opacity: 0.3 },
              },
            ],
          }}
        />

        {/* Monthly Active Users */}
        <ChartCard
          title="کاربران فعال ماهانه"
          loading={loading}
          option={{
            xAxis: {
              type: 'category',
              data: monthlyActive.map((d) => toJalaliMonth(d.date)),
              
            },
            yAxis: { type: 'value' },
            series: [
              {
                name: 'کاربران فعال',
                type: 'bar',
                data: monthlyActive.map((d) => d.value),
                color: chartColors[1],
              },
            ],
          }}
        />

        {/* Activity Distribution */}
        <ChartCard
          title="توزیع فعالیت کاربران"
          loading={loading}
          option={{
            xAxis: { show: false },
            yAxis: { show: false },
            tooltip: { trigger: 'item' },
            series: [
              {
                type: 'pie',
                radius: '60%',
                data: activityDist.map((a) => ({ name: a.name, value: a.value })),
                color: chartColors,
                label: { fontFamily: 'Vazirmatn' },
              },
            ],
          }}
        />

        {/* Buy vs Sell Comparison */}
        <ChartCard
          title="مقایسه حجم خرید و فروش"
          loading={loading}
          option={{
            xAxis: {
              type: 'category',
              data: buySellComparison.map((d) => toJalaliMonth(d.month)),
              
            },
            yAxis: { type: 'value' },
            series: [
              {
                name: 'خرید',
                type: 'line',
                data: buySellComparison.map((d) => d.buy_amount),
                color: chartColors[2],
                smooth: true,
              },
              {
                name: 'فروش',
                type: 'line',
                data: buySellComparison.map((d) => d.sell_amount),
                color: chartColors[3],
                smooth: true,
              },
            ],
          }}
        />

        {/* Top Buyers */}
        <ChartCard
          title="۱۰ خریدار برتر"
          loading={loading}
          option={{
            yAxis: {
              type: 'category',
              data: topBuyers.map((b, i) => `#${i + 1}`).reverse(),
            },
            xAxis: { type: 'value' },
            series: [
              {
                name: 'حجم خرید',
                type: 'bar',
                data: topBuyers.map((b) => b.total_amount).reverse(),
                color: chartColors[4],
              },
            ],
          }}
        />

        {/* Top Sellers */}
        <ChartCard
          title="۱۰ فروشنده برتر"
          loading={loading}
          option={{
            yAxis: {
              type: 'category',
              data: topSellers.map((s, i) => `#${i + 1}`).reverse(),
            },
            xAxis: { type: 'value' },
            series: [
              {
                name: 'حجم فروش',
                type: 'bar',
                data: topSellers.map((s) => s.total_amount).reverse(),
                color: chartColors[5],
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
