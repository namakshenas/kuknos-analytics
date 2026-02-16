import React from 'react';
import { formatNumber, formatRial, formatPercent, formatDecimal } from '../utils/formatters';

/**
 * KPI Card component - displays a single metric with label and formatted value
 */
export default function KPICard({ label, value, format, icon, lazy }) {
  const formatValue = () => {
    switch (format) {
      case 'rial':
        return formatRial(value);
      case 'percent':
        return formatPercent(value);
      case 'decimal':
        return formatDecimal(value);
      case 'number':
      default:
        return formatNumber(value);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          {lazy ? (
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{formatValue()}</p>
          )}
        </div>
        {icon && (
          <div className="text-indigo-600 opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
