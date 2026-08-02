import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Buys from './pages/Buys';
import Refunds from './pages/Refunds';
import UserAnalytics from './pages/UserAnalytics';
import ComingSoon from './pages/ComingSoon';
import { navItems } from './config/navigation';

const PAGES = {
  refunds: Refunds,
  buys: Buys,
  users: UserAnalytics,
};

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/refunds" replace />} />

          {/* Routes are generated from the same config the sidebar reads, so a
              section's title always matches the item that was clicked. */}
          {navItems.map(({ key, path, label }) => {
            const Page = PAGES[key];
            return (
              <Route
                key={key}
                path={path}
                element={Page ? <Page /> : <ComingSoon title={label} />}
              />
            );
          })}

          <Route path="*" element={<Navigate to="/refunds" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
