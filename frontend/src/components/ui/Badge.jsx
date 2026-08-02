import { cn } from '../../utils/cn';

const TONES = {
  neutral: 'bg-surface-hover text-content-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export default function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
