import { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import jalaali from 'jalaali-js';

/**
 * Default filter window: a fixed Jalali start date through today.
 *
 * NOTE: the start (1404/10/01) is a hardcoded literal carried over from the
 * original implementation. It is not derived from today's date, so the window
 * silently widens as time passes. Left as-is deliberately — changing it would
 * change which rows every page loads by default, which is a product decision
 * rather than a styling one.
 */
export function getCurrentJalaliMonth() {
  const now = new Date();
  const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return {
    start: new DateObject({ year: 1404, month: 10, day: 1, calendar: persian, locale: persian_fa }),
    end: new DateObject({ year: j.jy, month: j.jm, day: j.jd, calendar: persian, locale: persian_fa }),
  };
}

/** DateObject -> `YYYY-MM-DD` Gregorian, which is what the API expects. */
export function toGregorian(dateObj) {
  if (!dateObj) return null;
  const g = dateObj.convert().toDate();
  return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, '0')}-${String(g.getDate()).padStart(2, '0')}`;
}

export function getDefaultDateRange() {
  const { start, end } = getCurrentJalaliMonth();
  return {
    gregorianStart: toGregorian(start),
    gregorianEnd: toGregorian(end),
  };
}
