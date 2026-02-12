import React from 'react';
import ReactECharts from 'echarts-for-react';
import { persianChartDefaults } from '../utils/chartDefaults';

/**
 * Chart Card component - wrapper around ECharts with loading and error states
 */
export default function ChartCard({ title, option, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">خطا در بارگذاری نمودار</p>
        </div>
      </div>
    );
  }

  // Deep merge Persian defaults with provided options
  const mergedOption = {
    ...persianChartDefaults,
    ...option,
    textStyle: {
      ...persianChartDefaults.textStyle,
      ...option.textStyle,
    },
    tooltip: {
      ...persianChartDefaults.tooltip,
      ...option.tooltip,
    },
    grid: {
      ...persianChartDefaults.grid,
      ...option.grid,
    },
    xAxis: option.xAxis ? {
      ...persianChartDefaults.xAxis,
      ...option.xAxis,
      axisLabel: {
        ...persianChartDefaults.xAxis?.axisLabel,
        ...option.xAxis?.axisLabel,
      }
    } : persianChartDefaults.xAxis,
    yAxis: option.yAxis ? {
      ...persianChartDefaults.yAxis,
      ...option.yAxis,
      axisLabel: {
        ...persianChartDefaults.yAxis?.axisLabel,
        ...option.yAxis?.axisLabel,
      }
    } : persianChartDefaults.yAxis,
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ReactECharts
        option={mergedOption}
        style={{ height: '300px' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
