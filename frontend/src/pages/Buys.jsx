import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DateFilter, { getDefaultDateRange } from '../components/DateFilter';
import { chartColors } from '../utils/chartDefaults';
import { toJalali, toJalaliShort, toJalaliMonth } from '../utils/formatters';

export default function Buys() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.gregorianStart);
  const [endDate, setEndDate] = useState(defaults.gregorianEnd);

  const [kpis, setKpis] = useState([]);
  const [dailyCount, setDailyCount] = useState([]);
  const [dailyVolume, setDailyVolume] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [exchangeRate, setExchangeRate] = useState([]);
  const [byGateway, setByGateway] = useState([]);
  const [byApplication, setByApplication] = useState([]);
  const [amountDist, setAmountDist] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { start_date: startDate, end_date: endDate };

      const [
        kpisRes, dailyCountRes, dailyVolumeRes, monthlyRes,
        rateRes, gatewayRes, appRes, amountRes,
      ] = await Promise.all([
        client.get('/buys/kpis', { params }),
        client.get('/buys/daily-count', { params }),
        client.get('/buys/daily-volume', { params }),
        client.get('/buys/monthly-trend', { params }),
        client.get('/buys/exchange-rate-trend', { params }),
        client.get('/buys/by-gateway', { params }),
        client.get('/buys/by-application', { params }),
        client.get('/buys/amount-distribution', { params }),
      ]);

      setKpis(kpisRes.data.kpis);
      setDailyCount(dailyCountRes.data.series);
      setDailyVolume(dailyVolumeRes.data.series);
      setMonthlyTrend(monthlyRes.data.series);
      setExchangeRate(rateRes.data.series);
      setByGateway(gatewayRes.data.data);
      setByApplication(appRes.data.data);
      setAmountDist(amountRes.data.data);
    } catch (err) {
      console.error('Error fetching buys data:', err);
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
      <h2 className="text-2xl font-bold mb-4 text-gray-900">خرید / پرداخت‌ها</h2>
      <DateFilter onApply={handleDateApply} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {loading
          ? Array(6)
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
          title="تعداد خریدها در روز"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: dailyCount.map((d) => toJalali(d.date)) },
            yAxis: { type: 'value' },
            series: [{ name: 'تعداد', type: 'line', data: dailyCount.map((d) => d.value), color: chartColors[0], smooth: true }],
          }}
        />
        <ChartCard
          title="حجم خرید روزانه (ریال)"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: dailyVolume.map((d) => toJalali(d.date)) },
            yAxis: { type: 'value' },
            series: [{ name: 'حجم (ریال)', type: 'line', data: dailyVolume.map((d) => d.value), color: chartColors[1], smooth: true, areaStyle: { opacity: 0.3 } }],
          }}
        />
        <ChartCard
          title="توزیع براساس درگاه پرداخت"
          loading={loading}
          option={{
            xAxis: { show: false },
            yAxis: { show: false },
            tooltip: { trigger: 'item' },
            series: [{ type: 'pie', radius: '60%', data: byGateway.map((g) => ({ name: g.name, value: g.count })), color: chartColors, label: { fontFamily: 'Vazirmatn' } }],
          }}
        />
        <ChartCard
          title="توزیع براساس اپلیکیشن"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: byApplication.map((a) => a.name) },
            yAxis: { type: 'value' },
            series: [{ name: 'تعداد', type: 'bar', data: byApplication.map((a) => a.value), color: chartColors[2] }],
          }}
        />
        <ChartCard
          title="توزیع مقدار خرید"
          loading={loading}
          option={{
            xAxis: { type: 'category', data: amountDist.map((a) => a.name) },
            yAxis: { type: 'value' },
            series: [{ name: 'تعداد', type: 'bar', data: amountDist.map((a) => a.value), color: chartColors[3] }],
          }}
        />
      </div>
    </div>
  );
}
