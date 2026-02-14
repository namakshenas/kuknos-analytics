import { formatNumber, toPersianDigits } from './formatters';

/**
 * Default Persian/RTL configuration for ECharts
 * Merge these defaults with chart-specific options
 */
export const persianChartDefaults = {
  textStyle: {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 12,
  },
  tooltip: {
    textStyle: { fontFamily: 'Vazirmatn' },
    trigger: 'axis',
    formatter: (params) => {
      if (Array.isArray(params)) {
        const date = params[0]?.axisValue || params[0]?.name || '';
        let result = `${date}<br/>`;
        params.forEach(p => {
          const value = formatNumber(p.value);
          result += `${p.marker} ${p.seriesName || ''}: ${value}<br/>`;
        });
        return result;
      }
      return `${params.name}: ${formatNumber(params.value)}`;
    }
  },
  grid: {
    left: '8%',
    right: '5%',
    bottom: '20%',  // Extra space for rotated X-axis labels
    containLabel: true
  },
  xAxis: {
    axisLabel: {
      fontFamily: 'Vazirmatn, sans-serif',
      rotate: 45,
      fontSize: 10,
      margin: 20,  // More space between label and axis
      align: 'left',  // Align left for rotated labels in RTL
      verticalAlign: 'top',
      interval: 'auto',  // Auto-calculate label interval to avoid overlap
      showMaxLabel: true,
      showMinLabel: true,
    }
  },
  yAxis: {
    axisLabel: {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 11,
      margin: 20,  // Move labels further left to avoid overlap
      formatter: (value) => {
        // Format Y-axis numbers in Persian
        if (value >= 1000000) {
          return toPersianDigits((value / 1000000).toFixed(1)) + 'M';
        } else if (value >= 1000) {
          return toPersianDigits((value / 1000).toFixed(1)) + 'K';
        }
        return toPersianDigits(value);
      }
    }
  }
};

/**
 * Color palette for charts
 */
export const chartColors = [
  '#4F46E5', // indigo-600
  '#7C3AED', // violet-600
  '#DB2777', // pink-600
  '#DC2626', // red-600
  '#EA580C', // orange-600
  '#CA8A04', // yellow-600
  '#16A34A', // green-600
  '#0891B2', // cyan-600
  '#6366F1', // indigo-500
  '#8B5CF6', // violet-500
];
