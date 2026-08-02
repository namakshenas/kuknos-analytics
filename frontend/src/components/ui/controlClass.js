import { cn } from '../../utils/cn';

/**
 * Shared form-control chrome — one input recipe instead of the previous three
 * (the filter bar, the token select and the in-table filters each had their own
 * ring width, radius and indigo shade).
 *
 * Lives in its own module because `react-multi-date-picker` takes a class
 * string rather than a component, so this has to be importable without
 * dragging a component export along.
 */
export const controlClass = cn(
  'h-9 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm',
  'text-content placeholder:text-content-subtle',
  'transition-colors duration-fast',
  'hover:border-primary/40'
);
