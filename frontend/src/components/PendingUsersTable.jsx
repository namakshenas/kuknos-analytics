import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import client from '../api/client';
import { formatNumber, toPersianDigits } from '../utils/formatters';

const COLUMNS = [
  { key: 'first_name', label: 'نام' },
  { key: 'last_name', label: 'نام خانوادگی' },
  { key: 'national_id', label: 'کد ملی' },
  { key: 'mobile', label: 'موبایل' },
  { key: 'amount', label: 'مقدار PMN', numeric: true },
  { key: 'refund_price', label: 'مبلغ بازخرید (ریال)', numeric: true },
  { key: 'iban', label: 'شبا' },
  { key: 'cardnumber', label: 'شماره کارت' },
  { key: 'public', label: 'کلید عمومی' },
];

const PAGE_SIZES = [50, 100, 200];

export default function PendingUsersTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const buildFilterParams = (f) => {
    const params = {};
    Object.entries(f).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    return params;
  };

  const fetchData = useCallback(async (p, ps, f) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: p, page_size: ps, ...buildFilterParams(f) };
      const res = await client.get('/users/pending-users', { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError(err.response?.status === 503
        ? 'خطا در اتصال به پایگاه داده'
        : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, pageSize, filters);
  }, [page, pageSize, fetchData]);

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchData(1, pageSize, next);
    }, 400);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = buildFilterParams(filters);
      const res = await client.get('/users/pending-users/export', { params });
      const rows = res.data.data;

      const header = COLUMNS.map((c) => c.label);
      const body = rows.map((row) =>
        COLUMNS.map((col) => (row[col.key] ?? ''))
      );

      const ws = XLSX.utils.aoa_to_sheet([header, ...body]);

      // Set column widths
      ws['!cols'] = COLUMNS.map((col) =>
        col.numeric ? { wch: 18 } : { wch: 22 }
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'بازخرید معلق');
      XLSX.writeFile(wb, 'pending_refunds.xlsx', { bookType: 'xlsx' });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goTo = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-8 mx-1">
        <p className="text-red-600 mb-3">{error}</p>
        <button
          onClick={() => fetchData(page, pageSize, filters)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm mt-8 mx-1 overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">کاربران با بازخرید معلق</h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
            {toPersianDigits(total)} نتیجه
          </span>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={15} />
          {exporting ? 'در حال خروجی...' : 'خروجی اکسل'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              {COLUMNS.map((col) => (
                <th key={`f-${col.key}`} className="px-4 pb-2.5">
                  {!col.numeric ? (
                    <input
                      type="text"
                      placeholder="جستجو..."
                      value={filters[col.key] || ''}
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                    />
                  ) : (
                    <div className="h-7" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center py-12 text-gray-400">
                  داده‌ای یافت نشد
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {col.numeric
                        ? formatNumber(row[col.key])
                        : toPersianDigits(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <span>تعداد در صفحه:</span>
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => { setPageSize(s); setPage(1); }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pageSize === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {toPersianDigits(s)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            قبلی
          </button>
          <span className="px-3 py-1 text-gray-600">
            {toPersianDigits(page)} / {toPersianDigits(totalPages)}
          </span>
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            بعدی
          </button>
        </div>
      </div>
    </div>
  );
}
