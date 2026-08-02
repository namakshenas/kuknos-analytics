import { formatNumber, toPersianDigits } from './formatters';

const FONT = '"Vazirmatn Variable", sans-serif';

/**
 * Read a design token at runtime so charts and DOM never drift apart —
 * and so a future dark theme needs no changes here.
 */
function tokenColor(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
  return raw ? `rgb(${raw})` : fallback;
}

/**
 * Categorical series palette.
 *
 * Replaces the previous 10-hex hue ramp, where indigo-600/indigo-500 and
 * violet-600/violet-500 were near-identical and adjacent pie slices could be
 * indistinguishable. These eight are separated in both hue and lightness, and
 * every one clears 3:1 against white (WCAG non-text contrast).
 *
 * Red is deliberately absent: it belongs to error/danger only, and the old
 * palette used red-600 as an ordinary category.
 */
export const chartColors = [
  '#4F46E5', // indigo-600 — brand
  '#0891B2', // cyan-600
  '#16A34A', // green-600
  '#A16207', // yellow-700 (not yellow-600: that failed 3:1)
  '#EA580C', // orange-600
  '#DB2777', // pink-600
  '#0F766E', // teal-700
  '#475569', // slate-600
];

/** Dash patterns so multi-series lines stay readable without colour. */
const LINE_TYPES = ['solid', 'dashed', 'dotted'];

/**
 * Persian-language axis abbreviations.
 *
 * The old formatter emitted Latin `K`/`M` next to Persian digits ("۱٫۵M"),
 * mixing scripts mid-token. These read correctly in an RTL Persian UI.
 */
function abbreviatePersian(value) {
  if (typeof value !== 'number') return toPersianDigits(value);
  const scale = (n, word) => {
    // Drop a redundant ".0" so ticks read "۸۵ هزار", not "۸۵٫۰ هزار"
    const num = Number((value / n).toFixed(1));
    return `${toPersianDigits(String(num).replace('.', '٫'))} ${word}`;
  };
  const abs = Math.abs(value);
  if (abs >= 1e9) return scale(1e9, 'میلیارد');
  if (abs >= 1e6) return scale(1e6, 'میلیون');
  if (abs >= 1e3) return scale(1e3, 'هزار');
  return toPersianDigits(value);
}

/** Base option shared by every chart. */
export function baseOption() {
  const text = tokenColor('text', 'rgb(15 23 42)');
  const muted = tokenColor('text-muted', 'rgb(71 85 105)');
  const subtle = tokenColor('text-subtle', 'rgb(100 116 139)');
  const border = tokenColor('border', 'rgb(226 232 240)');
  const surface = tokenColor('surface', 'rgb(255 255 255)');

  return {
    color: chartColors,
    // Lets screen readers reach the data at all — ECharts ships this off.
    aria: { enabled: true, decal: { show: false } },
    animationDuration: 300,
    animationEasing: 'cubicOut',
    textStyle: { fontFamily: FONT, fontSize: 12, color: muted },
    grid: { top: 16, left: 8, right: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: surface,
      borderColor: border,
      borderWidth: 1,
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 8px 24px rgb(15 23 42 / 0.10); border-radius: 8px;',
      textStyle: { fontFamily: FONT, fontSize: 12, color: text },
      axisPointer: { type: 'line', lineStyle: { color: border } },
      formatter: (params) => {
        if (!Array.isArray(params)) {
          return `${params.name}: <b>${formatNumber(params.value)}</b>`;
        }
        const head = params[0]?.axisValue ?? '';
        const rows = params
          .map((p) => `${p.marker} ${p.seriesName ?? ''} <b>${formatNumber(p.value)}</b>`)
          .join('<br/>');
        return `<div style="color:${subtle};margin-bottom:4px">${head}</div>${rows}`;
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: FONT,
        fontSize: 11,
        color: subtle,
        margin: 12,
        // The old defaults forced `rotate: 45, fontSize: 10` on EVERY chart,
        // including pies. hideOverlap keeps labels horizontal and simply
        // drops the ones that would collide (skill rule `axis-readability`).
        hideOverlap: true,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      // Low-contrast gridlines so they don't compete with the data
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
      // Fewer ticks than the default 5: spelled-out Persian scale words are
      // wide, and on a scaled axis the default crowded them into each other.
      splitNumber: 4,
      axisLabel: {
        fontFamily: FONT,
        fontSize: 11,
        color: subtle,
        margin: 12,
        hideOverlap: true,
        formatter: abbreviatePersian,
      },
    },
  };
}

/**
 * Per-chart-type presets, so pages stop repeating `smooth: true`,
 * `areaStyle: { opacity: 0.3 }`, and the whole pie option block inline —
 * and stop hand-picking palette indices, which had drifted per page
 * (Buys used 0–3, Refunds 4–8, UserAnalytics 0–5).
 */
export const preset = {
  line: ({ name, data, categories, color = chartColors[0], area = false, index = 0 }) => ({
    xAxis: { data: categories },
    series: [
      {
        name,
        type: 'line',
        data,
        smooth: true,
        showSymbol: false,
        // ≥44px-equivalent hover target on a sparse line
        symbolSize: 8,
        lineStyle: { width: 2, type: LINE_TYPES[index % LINE_TYPES.length] },
        itemStyle: { color },
        ...(area
          ? {
              areaStyle: {
                opacity: 0.14,
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color },
                    { offset: 1, color: 'transparent' },
                  ],
                },
              },
            }
          : {}),
      },
    ],
  }),

  /**
   * Two or more series over the same axis. Each line gets its own dash
   * pattern as well as its own colour, so the series stay distinguishable in
   * greyscale and for colourblind readers (skill rule `color-not-only`).
   */
  multiLine: ({ series, categories }) => ({
    xAxis: { data: categories },
    legend: {
      top: 0,
      left: 'center',
      itemWidth: 16,
      itemHeight: 8,
      itemGap: 18,
      textStyle: { fontFamily: FONT, fontSize: 11 },
    },
    grid: { top: 36, left: 8, right: 8, bottom: 8, containLabel: true },
    series: series.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      showSymbol: false,
      symbolSize: 8,
      lineStyle: { width: 2, type: LINE_TYPES[i % LINE_TYPES.length] },
      itemStyle: { color: s.color ?? chartColors[i % chartColors.length] },
    })),
  }),

  /**
   * Horizontal bars — for ranked lists, where long labels need the room.
   * Swaps which axis carries the value formatter; the shared base assumes
   * category-x / value-y.
   */
  barHorizontal: ({ name, data, categories, color = chartColors[0] }) => ({
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { type: 'dashed' } },
      axisLabel: { formatter: abbreviatePersian, hideOverlap: true },
    },
    yAxis: {
      type: 'category',
      data: categories,
      splitLine: { show: false },
      axisLabel: { formatter: (v) => v },
    },
    grid: { top: 8, left: 8, right: 16, bottom: 8, containLabel: true },
    series: [
      {
        name,
        type: 'bar',
        data,
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 18,
      },
    ],
  }),

  bar: ({ name, data, categories, color = chartColors[0] }) => ({
    xAxis: { data: categories, boundaryGap: true },
    series: [
      {
        name,
        type: 'bar',
        data,
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 36,
      },
    ],
  }),

  /**
   * Donut rather than pie: the hole gives the legend room and makes small
   * slices easier to compare. Legend is interactive (skill rule
   * `legend-interactive`) and always shown (`legend-visible`).
   */
  pie: ({ name, data }) => ({
    xAxis: { show: false },
    yAxis: { show: false },
    grid: { show: false },
    tooltip: { trigger: 'item' },
    // Legend along the bottom, not the side: Persian category labels need the
    // full width, and a vertical legend squeezed them against the donut.
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
      textStyle: { fontFamily: FONT, fontSize: 11 },
    },
    series: [
      {
        name,
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '46%'],
        data,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 6 },
      },
    ],
  }),

  candlestick: ({ name, data, categories }) => ({
    xAxis: { data: categories, boundaryGap: true },
    // `scale: true` zooms to the data range, which makes ECharts generate more
    // ticks than the shared default; cap them so the Persian scale words fit.
    yAxis: { scale: true, splitNumber: 3 },
    series: [
      {
        name,
        type: 'candlestick',
        data,
        itemStyle: {
          color: tokenColor('success', 'rgb(22 163 74)'),
          color0: tokenColor('danger', 'rgb(220 38 38)'),
          borderColor: tokenColor('success', 'rgb(22 163 74)'),
          borderColor0: tokenColor('danger', 'rgb(220 38 38)'),
        },
      },
    ],
  }),
};

/**
 * Zoom controls for long daily series. The daily charts carry ~380 points,
 * which is why axis labels were unreadable in the first place; letting the
 * user scope the window beats shrinking the type (`Hover + Zoom` is the
 * interaction level the skill's chart data prescribes for time series).
 */
export function withZoom(option, { start = 0 } = {}) {
  const subtle = tokenColor('text-subtle', 'rgb(100 116 139)');
  const border = tokenColor('border', 'rgb(226 232 240)');
  return {
    ...option,
    grid: { ...(option.grid || {}), bottom: 48 },
    dataZoom: [
      { type: 'inside', start, end: 100, zoomOnMouseWheel: false, moveOnMouseWheel: false },
      {
        type: 'slider',
        start,
        end: 100,
        height: 22,
        bottom: 8,
        borderColor: border,
        fillerColor: 'rgb(79 70 229 / 0.10)',
        handleStyle: { color: '#fff', borderColor: subtle },
        moveHandleSize: 4,
        textStyle: { fontFamily: FONT, fontSize: 10, color: subtle },
        labelFormatter: '',
      },
    ],
  };
}
