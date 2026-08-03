import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Buys from './pages/Buys';
import Refunds from './pages/Refunds';
import UserAnalytics from './pages/UserAnalytics';
import ComingSoon from './pages/ComingSoon';
import Home from './pages/Home';
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
          {/* The intro page is the app's home, reached from the header logo.
              It states the two caveats — Kuknos Wallet only, still in
              development — before anyone reads a figure. */}
          <Route path="/" element={<Home />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
