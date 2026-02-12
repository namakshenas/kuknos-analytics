import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Buys from './pages/Buys';
import Refunds from './pages/Refunds';
import UserAnalytics from './pages/UserAnalytics';
import PlaceholderA from './pages/PlaceholderA';
import PlaceholderB from './pages/PlaceholderB';
import PlaceholderC from './pages/PlaceholderC';

/**
 * Main App component with routing
 */
export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Default route redirects to refunds */}
          <Route path="/" element={<Navigate to="/refunds" replace />} />

          {/* Main pages */}
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/buys" element={<Buys />} />
          <Route path="/users" element={<UserAnalytics />} />

          {/* Placeholder pages */}
          <Route path="/section-a" element={<PlaceholderA />} />
          <Route path="/section-b" element={<PlaceholderB />} />
          <Route path="/section-c" element={<PlaceholderC />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/refunds" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
