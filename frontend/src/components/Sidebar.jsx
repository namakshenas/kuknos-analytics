import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftCircle, ShoppingCart, Users, LayoutGrid, ChevronRight, Calculator } from 'lucide-react';

const menuItems = [
  { key: 'refunds', label: 'بازخریدها', path: '/refunds', icon: ArrowLeftCircle },
  { key: 'buys', label: 'فروش / پرداخت‌ها', path: '/buys', icon: ShoppingCart },
  { key: 'users', label: 'تحلیل کاربران', path: '/users', icon: Users },
  { key: 'section-a', label: 'حسابداری', path: '/section-a', icon: Calculator },
  { key: 'section-b', label: 'بخش B', path: '/section-b', icon: LayoutGrid },
  { key: 'section-c', label: 'بخش C', path: '/section-c', icon: LayoutGrid },
];

/**
 * Sidebar component - RTL navigation menu with collapse functionality
 */
export default function Sidebar({ collapsed, toggleCollapsed }) {
  const location = useLocation();

  return (
    <div
      className={`bg-white border-l border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        {!collapsed && <h2 className="font-bold text-lg text-gray-800">منو</h2>}
        <button
          onClick={toggleCollapsed}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
        >
          <ChevronRight
            size={20}
            className={`transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
