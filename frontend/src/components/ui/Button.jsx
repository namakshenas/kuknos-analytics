import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
  secondary: 'bg-surface text-content-muted border border-border-strong hover:bg-surface-hover',
  success: 'bg-success text-white hover:brightness-95',
  danger: 'bg-danger text-white hover:brightness-95',
  ghost: 'text-content-muted hover:bg-surface-hover',
};

const SIZES = {
  // ≥36px tall so pointer targets stay comfortable (skill rule `touch-target-size`)
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

/**
 * Collapses the four ad-hoc button recipes (indigo primary, red retry,
 * emerald export, grey pagination) into one component.
 *
 * `loading` disables the button and swaps in a spinner — skill rule
 * `loading-buttons`: never leave an async action looking idle.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap',
        'transition-colors duration-fast ease-out cursor-pointer',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={16} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
