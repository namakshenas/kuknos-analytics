import React, { useState } from 'react';
import Sidebar from './Sidebar';

/**
 * Layout component - defines the overall RTL structure with header and sidebar
 */
export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <img src="/kuknos_co_logo.jpeg" alt="ققنوس" className="h-8 w-8 object-contain" />
        <h1 className="text-2xl font-bold text-gray-900">ققنوس آنالتیکس</h1>
      </header>

      {/* Main container with sidebar and content */}
      <div className="flex">
        {/* Sidebar (on the right in RTL) */}
        <Sidebar
          collapsed={sidebarCollapsed}
          toggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main content area (on the left in RTL) */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
