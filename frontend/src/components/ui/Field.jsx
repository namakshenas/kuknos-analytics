import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { controlClass } from './controlClass';

/**
 * Native select with a visible label and a themed chevron.
 * Native on purpose: it inherits the platform's keyboard handling, the touch
 * wheel on mobile, and screen-reader semantics (skill rule `system-controls`).
 */
export function Select({ label, id, value, onChange, options, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <label htmlFor={id} className="whitespace-nowrap text-sm text-content-muted">
          {label}
        </label>
      )}
      <div className="relative w-40">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(controlClass, 'cursor-pointer appearance-none ps-3 pe-9')}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 end-3 my-auto text-content-subtle"
        />
      </div>
    </div>
  );
}

/** Text input matching the Select chrome. `sm` is for in-table filter rows. */
export function TextInput({ size = 'md', className, ...rest }) {
  return (
    <input
      type="text"
      className={cn(controlClass, size === 'sm' && 'h-8 px-2.5 text-xs', className)}
      {...rest}
    />
  );
}
