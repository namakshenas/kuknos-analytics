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
