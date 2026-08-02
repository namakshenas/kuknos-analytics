import { useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { Filter } from 'lucide-react';
import { Button, Card } from './ui';
import { controlClass } from './ui/controlClass';
import { getCurrentJalaliMonth, toGregorian } from '../utils/dateRange';
import { cn } from '../utils/cn';

const dateInputClass = cn(controlClass, 'w-32 cursor-pointer text-center');

/**
 * Filter bar. `children` is a leading slot — the token dropdown sits there so
 * both filters share one row instead of stacking two control strips.
 *
 * Sits in a Card now rather than floating above an `<hr>`, which groups the
 * controls visually and matches every other surface in the app.
 */
export default function DateFilter({ onApply, children }) {
  const defaults = getCurrentJalaliMonth();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const handleApply = () => {
    const startG = toGregorian(startDate);
    const endG = toGregorian(endDate);
    if (startG && endG) onApply(startG, endG);
  };

  return (
    <Card padding="sm" className="mb-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2 text-content-subtle">
          <Filter size={15} aria-hidden="true" />
          <span className="text-sm font-medium">فیلترها</span>
        </div>

        {children}

        <div className="flex items-center gap-2">
          <label className="text-sm text-content-muted">از</label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            inputClass={dateInputClass}
          />
          <label className="text-sm text-content-muted">تا</label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            inputClass={dateInputClass}
          />
        </div>

        <Button size="sm" onClick={handleApply} className="ms-auto">
          اعمال
        </Button>
      </div>
    </Card>
  );
}
