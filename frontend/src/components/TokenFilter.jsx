import { Select } from './ui';
import { TOKENS } from '../utils/tokens';

const OPTIONS = TOKENS.map((code) => ({ value: code, label: code }));

/**
 * Token dropdown — changing the selection refreshes every KPI card and chart
 * on the page.
 */
export default function TokenFilter({ value, onChange }) {
  return (
    <Select
      id="token-filter"
      label="توکن"
      value={value}
      onChange={onChange}
      options={OPTIONS}
      className="min-w-0"
    />
  );
}
