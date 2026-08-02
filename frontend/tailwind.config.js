/** @type {import('tailwindcss').Config} */

/** Semantic color -> CSS variable, with opacity-modifier support. */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn Variable', 'sans-serif'],
      },
      colors: {
        bg: token('bg'),
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
          hover: token('surface-hover'),
        },
        border: {
          DEFAULT: token('border'),
          strong: token('border-strong'),
        },
        content: {
          DEFAULT: token('text'),
          muted: token('text-muted'),
          subtle: token('text-subtle'),
        },
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          soft: token('primary-soft'),
          fg: token('on-primary'),
        },
        accent: {
          DEFAULT: token('accent'),
          soft: token('accent-soft'),
        },
        success: {
          DEFAULT: token('success'),
          soft: token('success-soft'),
        },
        warning: {
          DEFAULT: token('warning'),
          soft: token('warning-soft'),
        },
        danger: {
          DEFAULT: token('danger'),
          soft: token('danger-soft'),
        },
        ring: token('ring'),
      },
      spacing: {
        header: 'var(--header-height)',
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        row: 'var(--table-row-height)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        // Content settling in. Transform/opacity only, so no reflow (skill
        // rules `transform-performance` + `layout-shift-avoid`).
        'fade-in-up': 'fade-in-up var(--duration-slow) var(--ease-out) both',
        'fade-in': 'fade-in var(--duration-base) var(--ease-out) both',
      },
    },
  },
  plugins: [],
}
