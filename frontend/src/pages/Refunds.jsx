import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DateFilter, { getDefaultDateRange } from '../components/DateFilter';
import { chartColors } from '../utils/chartDefaults';
import { toJalali, toJalaliShort, toJalaliMonth, formatNumber } from '../utils/formatters';

export default function Refunds() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.gregorianStart);
  const [endDate, setEndDate] = useState(defaults.gregorianEnd);

  const [kpis, setKpis] = useState([]);
  const [dailyCount, setDailyCount] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [rateTrend, setRateTrend] = useState([]);
  const [rateCandlestick, setRateCandlestick] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [byBank, setByBank] = useState([]);
  const [amountDist, setAmountDist] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { start_date: startDate, end_date: endDate };

      const [kpisRes, dailyRes, monthlyRes, rateRes, rateCandleRes, statusRes, bankRes, amountRes] =
        await Promise.all([
          client.get('/refunds/kpis', { params }),
          client.get('/refunds/daily-count', { params }),
          client.get('/refunds/monthly-trend', { params }),
          client.get('/refunds/rate-trend', { params }),
          client.get('/refunds/rate-candlestick', { params }),
          client.get('/refunds/status-distribution', { params }),
          client.get('/refunds/by-bank', { params }),
          client.get('/refunds/amount-distribution', { params }),
        ]);

      setKpis(kpisRes.data.kpis);
      setDailyCount(dailyRes.data.series);
      setMonthlyTrend(monthlyRes.data.series);
      setRateTrend(rateRes.data.series);
      setRateCandlestick(rateCandleRes.data.series);
      setStatusDist(statusRes.data.data);
      setByBank(bankRes.data.data);
      setAmountDist(amountRes.data.data);
    } catch (err) {
      console.error('Error fetching refunds data:', err);
      if (err.response?.status === 503) {
        setError('خطا در اتصال به پایگاه داده');
      } else {
        setError('خطا در دریافت اطلاعات');
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateApply = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

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
      <h2 className="text-2xl font-bold mb-4 text-gray-900">بازپرداخت‌ها</h2>
      <DateFilter onApply={handleDateApply} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {loading
          ? Array(8)
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
        <ChartCard
          title="نرخ بازپرداخت روزانه"
          loading={loading}
          option={{
            grid: { left: '2%', right: '5%', containLabel: true },
            xAxis: { type: 'category', data: rateCandlestick.map((d) => toJalali(d.date)), axisLabel: { rotate: 45 } },
            yAxis: { type: 'value', scale: true, axisLabel: { margin: 8, formatter: (val) => val.toLocaleString('fa-IR') } },
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'cross', label: { show: false } },
              formatter: (params) => {
                const p = Array.isArray(params) ? params[0] : params;
                if (!p || !p.value) return '';
                const [, open, close, low, high] = p.value;
                return `${p.axisValue}<br/>
                  باز: ${formatNumber(open)}<br/>
                  بسته: ${formatNumber(close)}<br/>
                  کمترین: ${formatNumber(low)}<br/>
                  بیشترین: ${formatNumber(high)}`;
              },
            },
            series: [
              {
                name: 'نرخ بازپرداخت',
                type: 'candlestick',
                data: rateCandlestick.map((d) => [d.open, d.close, d.low, d.high]),
                itemStyle: {
                  color: '#10b981',
                  color0: '#ef4444',
                  borderColor: '#10b981',
                  borderColor0: '#ef4444',
                },
              },
            ],
          }}
        />
        <ChartCard
          title="تعداد بازپرداخت‌ها در روز"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: dailyCount.map((d) => toJalali(d.date)) },
            yAxis: { type: 'value' },
            series: [{ name: 'تعداد', type: 'line', data: dailyCount.map((d) => d.value), color: chartColors[4], smooth: true }],
          }}
        />
        <ChartCard
          title="روند ماهانه بازپرداخت‌ها"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: monthlyTrend.map((d) => toJalaliMonth(d.date)) },
            yAxis: { type: 'value' },
            series: [{ name: 'تعداد', type: 'bar', data: monthlyTrend.map((d) => d.count), color: chartColors[5] }],
          }}
        />
        <ChartCard
          title="توزیع وضعیت بازپرداخت‌ها"
          loading={loading}
          option={{
            xAxis: { show: false },
            yAxis: { show: false },
            tooltip: { trigger: 'item' },
            series: [{ type: 'pie', radius: '60%', data: statusDist.map((s) => ({ name: s.name, value: s.value })), color: chartColors, label: { fontFamily: 'Vazirmatn' } }],
          }}
        />
        <ChartCard
          title="توزیع بازپرداخت‌ها براساس بانک"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: byBank.map((b) => b.name) },
            yAxis: { type: 'value' },
            series: [{ name: 'تعداد', type: 'bar', data: byBank.map((b) => b.count), color: chartColors[6] }],
          }}
        />
        <ChartCard
          title="توزیع مقدار بازپرداخت"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: amountDist.map((a) => a.name) },
            yAxis: { type: 'value' },
            series: [{ name: 'تعداد', type: 'bar', data: amountDist.map((a) => a.value), color: chartColors[7] }],
          }}
        />
        <ChartCard
          title="روند نرخ بازپرداخت"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: rateTrend.map((d) => toJalali(d.date)) },
            yAxis: { type: 'value' },
            series: [{ name: 'نرخ میانگین', type: 'line', data: rateTrend.map((d) => d.value), color: chartColors[8], smooth: true }],
          }}
        />
      </div>
    </div>
  );
}
