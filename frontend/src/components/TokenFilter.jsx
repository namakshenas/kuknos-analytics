import { TOKENS } from '../utils/tokens';

/**
 * Token dropdown — changing the selection refreshes every KPI card and chart on the page.
 */
export default function TokenFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="token-filter" className="text-sm text-gray-600">
        توکن:
      </label>
      <select
        id="token-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
      >
        {TOKENS.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
