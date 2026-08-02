/**
 * Join conditional class names.
 *
 * Deliberately minimal — no `tailwind-merge`. The `ui/` primitives take
 * variant/size/padding as props rather than expecting callers to override
 * conflicting utilities, so `className` only ever carries additive classes
 * (margins, grid placement) where source order doesn't matter.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
