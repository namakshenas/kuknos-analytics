import { cn } from '../../utils/cn';

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
};

/**
 * The one surface container. Replaces the copy-pasted
 * `bg-white p-6 rounded-xl shadow-sm border border-gray-200` recipe.
 */
export default function Card({ padding = 'md', className, children, ...rest }) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-xl shadow-sm',
        PADDING[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
