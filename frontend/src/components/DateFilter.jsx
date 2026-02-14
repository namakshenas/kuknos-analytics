import { useState } from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import jalaali from 'jalaali-js';

function getCurrentJalaliMonth() {
  const now = new Date();
  const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return {
    start: new DateObject({ year: 1404, month: 10, day: 1, calendar: persian, locale: persian_fa }),
    end: new DateObject({ year: j.jy, month: j.jm, day: j.jd, calendar: persian, locale: persian_fa }),
  };
}

function toGregorian(dateObj) {
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

export default function DateFilter({ onApply }) {
  const defaults = getCurrentJalaliMonth();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const handleApply = () => {
    const startG = toGregorian(startDate);
    const endG = toGregorian(endDate);
    if (startG && endG) {
      onApply(startG, endG);
    }
  };

  return (
    <>
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <label className="text-sm text-gray-600">از:</label>
      <DatePicker
        value={startDate}
        onChange={setStartDate}
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-right"
        inputClass="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
      />
      <label className="text-sm text-gray-600">تا:</label>
      <DatePicker
        value={endDate}
        onChange={setEndDate}
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-right"
        inputClass="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
      />
      <button
        onClick={handleApply}
        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
      >
        اعمال
      </button>
    </div>
    <hr className="border-gray-200 mb-6" />
  </>
  );
}
