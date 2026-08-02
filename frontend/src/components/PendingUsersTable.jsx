import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import client from '../api/client';
import { formatNumber, toPersianDigits, toJalali, toJalaliLatin } from '../utils/formatters';
import { errorMessage } from '../hooks/useAnalytics';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, TextInput } from './ui';
import { cn } from '../utils/cn';

const COLUMNS = [
  { key: 'first_name', label: 'نام' },
  { key: 'last_name', label: 'نام خانوادگی' },
  { key: 'national_id', label: 'کد ملی' },
  { key: 'mobile', label: 'موبایل' },
  { key: 'token', label: 'نوع توکن' },
  { key: 'amount', label: 'مقدار', numeric: true },
  { key: 'refund_price', label: 'مبلغ بازخرید (ریال)', numeric: true },
  { key: 'updated_at', label: 'تاریخ درخواست', date: true },
  { key: 'iban', label: 'شبا' },
  { key: 'cardnumber', label: 'شماره کارت' },
  { key: 'public', label: 'کلید عمومی' },
];

const PAGE_SIZES = [50, 100, 200];

/** Columns without a free-text search box in the filter row. */
const isFilterable = (col) => !col.numeric && !col.date;

/** Cell value as shown in the table (Persian digits, Jalali dates). */
const displayValue = (col, row) => {
  const value = row[col.key];
  if (col.date) return value ? toJalali(value) : '—';
  if (col.numeric) return formatNumber(value);
  return toPersianDigits(value ?? '—');
};

/** Cell value written to the Excel sheet (raw numbers, Jalali in Latin digits). */
const exportValue = (col, row) => {
  const value = row[col.key];
  if (col.date) return value ? toJalaliLatin(value) : '';
  return value ?? '';
};

export default function PendingUsersTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const buildFilterParams = (f) =>
    Object.fromEntries(Object.entries(f).filter(([, v]) => v));

  const fetchData = useCallback(async (p, ps, f) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const res = await client.get('/users/pending-users', {
        params: { page: p, page_size: ps, ...buildFilterParams(f) },
        signal: controller.signal,
      });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      const message = errorMessage(err);
      if (message) setError(message); // null means aborted — keep the old view
      else return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, pageSize, filters);
    return () => abortRef.current?.abort();
  }, [page, pageSize, fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const res = await client.get('/users/pending-users/export', {
        params: buildFilterParams(filters),
      });
      const rows = res.data.data;

      const header = COLUMNS.map((c) => c.label);
      const body = rows.map((row) => COLUMNS.map((col) => exportValue(col, row)));

      const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
      ws['!cols'] = COLUMNS.map((col) => (col.numeric ? { wch: 18 } : { wch: 22 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'بازخرید معلق');
      XLSX.writeFile(wb, 'pending_refunds.xlsx', { bookType: 'xlsx' });
    } catch (err) {
      console.error('Export failed:', err);
      setError('خطا در تهیه خروجی اکسل');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const goTo = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  return (
    <Card padding="none" className="mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-content">کاربران با بازخرید معلق</h3>
          <Badge>{toPersianDigits(total)} نتیجه</Badge>
        </div>
        <Button
          variant="success"
          size="sm"
          icon={Download}
          onClick={handleExport}
          loading={exporting}
          disabled={total === 0}
        >
          {exporting ? 'در حال تهیه خروجی…' : 'خروجی اکسل'}
        </Button>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => fetchData(page, pageSize, filters)}
          className="m-4 border-0 shadow-none"
        />
      ) : (
        <>
          {/* Plain scroll container. A fade-out mask on the overflowing edge
              was tried and dropped: in a table it dims real values, which is a
              worse trade than simply showing the scrollbar. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-sm">
              <caption className="sr-only">
                فهرست کاربران با بازخرید پرداخت‌نشده، همراه با مقدار، مبلغ و تاریخ درخواست
              </caption>
              <thead>
                {/* sticky so the header stays put while scanning long pages */}
                <tr className="sticky top-0 z-10 bg-surface-muted text-content-muted">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className="whitespace-nowrap px-3 py-2.5 text-start font-medium"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-border bg-surface-muted">
                  {COLUMNS.map((col) => (
                    <th key={`f-${col.key}`} scope="col" className="px-3 pb-2.5">
                      {isFilterable(col) ? (
                        <TextInput
                          size="sm"
                          placeholder="جستجو…"
                          aria-label={`جستجو در ${col.label}`}
                          value={filters[col.key] || ''}
                          onChange={(e) => handleFilterChange(col.key, e.target.value)}
                        />
                      ) : (
                        <div className="h-8" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className="h-row px-3">
                          <Skeleton className="h-4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        message="داده‌ای یافت نشد"
                        hint="عبارت جستجو را تغییر دهید"
                      />
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr
                      key={idx}
                      className="transition-colors duration-fast hover:bg-surface-hover"
                    >
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'h-row whitespace-nowrap px-3 text-content-muted',
                            col.numeric && 'font-medium text-content'
                          )}
                        >
                          {displayValue(col, row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-content-muted">تعداد در صفحه:</span>
              {PAGE_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPageSize(s);
                    setPage(1);
                  }}
                  aria-pressed={pageSize === s}
                  className={cn(
                    'min-w-9 rounded-md px-2 py-1 transition-colors duration-fast',
                    pageSize === s
                      ? 'bg-primary text-primary-fg font-medium'
                      : 'bg-surface-hover text-content-muted hover:bg-border'
                  )}
                >
                  {toPersianDigits(s)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {/* RTL: "previous" points to the right, "next" to the left. */}
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
              >
                قبلی
              </Button>
              <span className="px-2 text-content-muted">
                {toPersianDigits(page)} از {toPersianDigits(totalPages)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages}
              >
                بعدی
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
