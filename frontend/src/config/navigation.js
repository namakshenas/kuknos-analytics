import { ArrowLeftCircle, ShoppingCart, Users, Calculator, LayoutGrid } from 'lucide-react';

/**
 * Single source of truth for navigation. The sidebar and the router both read
 * this, so a section's label can't drift from its route — previously the
 * sidebar said "حسابداری" while the page rendered a generic placeholder.
 */
export const navItems = [
  { key: 'refunds', label: 'بازخریدها', path: '/refunds', icon: ArrowLeftCircle },
  { key: 'buys', label: 'فروش / پرداخت‌ها', path: '/buys', icon: ShoppingCart },
  { key: 'users', label: 'تحلیل کاربران', path: '/users', icon: Users },
  { key: 'section-a', label: 'حسابداری', path: '/section-a', icon: Calculator, comingSoon: true },
  { key: 'section-b', label: 'بخش B', path: '/section-b', icon: LayoutGrid, comingSoon: true },
  { key: 'section-c', label: 'بخش C', path: '/section-c', icon: LayoutGrid, comingSoon: true },
];
