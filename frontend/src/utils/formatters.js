import jalaali from 'jalaali-js';

/**
 * Convert Western digits (0-9) to Persian digits (۰-۹)
 */
export function toPersianDigits(num) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => persianDigits[d]);
}

/**
 * Format number with Persian thousands separator (٬)
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return toPersianDigits('0');
  const parts = Number(num).toFixed(0).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return toPersianDigits(parts.join('.'));
}

/**
 * Format Rial values with Persian digits and suffix
 */
export function formatRial(amount) {
  if (amount === null || amount === undefined) return toPersianDigits('۰ ریال');
  return `${formatNumber(amount)} ریال`;
}

/**
 * Persian short scale, largest first. Capped at میلیارد on purpose: Persian
 * finance writes «۱٬۲۳۵ میلیارد ریال», not «۱٫۲ هزار میلیارد ریال».
 */
const COMPACT_SCALES = [
  { unit: 1e9, word: 'میلیارد' },
  { unit: 1e6, word: 'میلیون' },
];

/**
 * Condensed number for KPI cards, where a full figure has nowhere to go —
 * a 13-digit rial value overflowed its card and lost its « ریال» suffix to
 * the ellipsis. Below a million the exact number is already short, so it is
 * left alone; above it, the value collapses onto a Persian scale word.
 *
 * Lossy by design — callers must keep the exact value reachable (KPICard puts
 * it in the `title` tooltip).
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined) return toPersianDigits('0');
  const value = Number(num);
  const scale = COMPACT_SCALES.find((s) => Math.abs(value) >= s.unit);
  if (!scale) return formatNumber(value);

  const mantissa = value / scale.unit;
  // One decimal keeps «۴۵٫۷ میلیارد» informative; past 100 it is noise. The
  // Number() round-trip drops a redundant ".0" — «۴۵ میلیارد», not «۴۵٫۰».
  const text =
    Math.abs(mantissa) < 100
      ? toPersianDigits(String(Number(mantissa.toFixed(1))).replace('.', '٫'))
      : formatNumber(mantissa);
  return `${text} ${scale.word}`;
}

/** Condensed Rial value — `formatCompactNumber` plus the unit. */
export function formatCompactRial(amount) {
  if (amount === null || amount === undefined) return toPersianDigits('۰ ریال');
  return `${formatCompactNumber(amount)} ریال`;
}

/**
 * Format percentage with Persian digits
 */
export function formatPercent(value) {
  if (value === null || value === undefined) return toPersianDigits('۰٪');
  return `${toPersianDigits(Number(value).toFixed(2).replace('.', '٫'))}٪`;
}

/**
 * Format decimal with Persian digits
 */
export function formatDecimal(value) {
  if (value === null || value === undefined) return toPersianDigits('۰');
  return toPersianDigits(Number(value).toFixed(2).replace('.', '٫'));
}

/**
 * Convert Gregorian date to Jalali (Persian calendar)
 */
export function toJalali(gregorianDate) {
  if (!gregorianDate) return '';
  const date = new Date(gregorianDate);
  const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toPersianDigits(j.jy)}/${toPersianDigits(String(j.jm).padStart(2, '0'))}/${toPersianDigits(String(j.jd).padStart(2, '0'))}`;
}

/**
 * Convert Gregorian date to Jalali with Latin digits — for spreadsheet exports,
 * where the cell should stay readable and sortable.
 */
export function toJalaliLatin(gregorianDate) {
  if (!gregorianDate) return '';
  const date = new Date(gregorianDate);
  const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

/**
 * Abbreviate a wallet address for display: `GACZ…7T9K`.
 * Left in Latin script — these are addresses, not numbers.
 */
export function shortWallet(wallet) {
  if (!wallet) return '—';
  return wallet.length <= 12 ? wallet : `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

/**
 * Persian month names
 */
export const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Get Persian month name from Gregorian date
 */
export function getPersianMonth(gregorianDate) {
  if (!gregorianDate) return '';
  const date = new Date(gregorianDate);
  const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return persianMonths[j.jm - 1];
}

/**
 * Convert Gregorian date to short Jalali format for charts (MM/DD)
 * For daily charts - shows only month and day
 */
export function toJalaliShort(gregorianDate) {
  if (!gregorianDate) return '';
  const date = new Date(gregorianDate);
  const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toPersianDigits(String(j.jm).padStart(2, '0'))}/${toPersianDigits(String(j.jd).padStart(2, '0'))}`;
}

/**
 * Convert Gregorian date to month name format for charts
 * For monthly charts - shows month name and year
 */
export function toJalaliMonth(gregorianDate) {
  if (!gregorianDate) return '';
  const date = new Date(gregorianDate);
  const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${persianMonths[j.jm - 1]} ${toPersianDigits(j.jy)}`;
}
