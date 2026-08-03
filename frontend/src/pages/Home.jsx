import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Info, Lock, Coins } from 'lucide-react';
import { Badge, Card } from '../components/ui';
import { navItems } from '../config/navigation';
import { TOKENS } from '../utils/tokens';

const active = navItems.filter((i) => !i.comingSoon);
const upcoming = navItems.filter((i) => i.comingSoon);

/** A labelled fact in the footer strip. */
function Fact({ icon, title, children }) {
  // Assigned rather than destructured as `icon: Icon`: this eslint config has
  // no react plugin, so a JSX-only reference doesn't count as a use.
  const Icon = icon;
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} className="mt-0.5 shrink-0 text-content-subtle" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-content">{title}</p>
        <p className="text-sm text-content-muted">{children}</p>
      </div>
    </div>
  );
}

/**
 * Landing page at `/`, reached from the header logo.
 *
 * Its job is to set expectations before anyone reads a number: the figures
 * cover Kuknos Wallet only, and the dashboard is still being built. The
 * section list is generated from `config/navigation.js` so it can never claim
 * a page exists that the router doesn't serve.
 */
export default function Home() {
  return (
    <div className="mx-auto max-w-4xl">
      <Card className="mb-5">
        <div className="flex items-start gap-4">
          <img
            src="/kuknos_co_logo.jpeg"
            alt=""
            width="56"
            height="56"
            className="hidden h-14 w-14 shrink-0 rounded-xl object-contain sm:block"
          />
          <div>
            <h2 className="text-2xl font-bold text-content">ققنوس آنالیتیکس</h2>
            <p className="mt-1 text-content-muted">
              داشبورد تحلیلی خرید، بازخرید و کاربران بر پایه داده‌های والت ققنوس
            </p>
          </div>
        </div>
      </Card>

      {/* The two things a reader must know before trusting any figure here. */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-primary/30 bg-primary-soft">
          <div className="flex items-start gap-3">
            <Info size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-content">فقط داده‌های «والت ققنوس»</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-content-muted">
                همه اعداد، نمودارها و گزارش‌های این داشبورد تنها بر پایه تراکنش‌های ثبت‌شده در
                <strong className="font-semibold text-content"> والت ققنوس </strong>
                محاسبه می‌شوند. داده‌های سایر کیف‌پول‌ها، صرافی‌ها یا سامانه‌های بیرونی در این
                آمار وجود ندارد.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-warning/30 bg-warning-soft">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-content">در حال توسعه</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-content-muted">
                این برنامه هنوز در حال توسعه است. برخی بخش‌ها کامل نشده‌اند و ممکن است عنوان‌ها،
                شیوه محاسبه و اعداد در نسخه‌های بعدی تغییر کنند. پیش از استفاده در گزارش‌های رسمی،
                نتایج را بررسی کنید.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none" className="mb-5 overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-semibold text-content">بخش‌های داشبورد</h3>
        </div>

        <ul className="divide-y divide-border">
          {active.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  to={item.path}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors duration-fast hover:bg-surface-hover"
                >
                  <span className="rounded-lg bg-primary-soft p-2 text-primary">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="font-medium text-content">{item.label}</span>
                  <ArrowLeft
                    size={16}
                    aria-hidden="true"
                    className="ms-auto text-content-subtle transition-transform duration-fast group-hover:-translate-x-1"
                  />
                </Link>
              </li>
            );
          })}

          {upcoming.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key} className="flex items-center gap-3 px-5 py-3.5">
                <span className="rounded-lg bg-surface-hover p-2 text-content-subtle">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="text-content-muted">{item.label}</span>
                <Badge tone="warning" className="ms-auto">
                  به زودی
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Fact icon={Coins} title="توکن‌های پشتیبانی‌شده">
            {TOKENS.join('، ')}
          </Fact>
          <Fact icon={Lock} title="فقط خواندنی">
            این داشبورد هیچ داده‌ای را تغییر نمی‌دهد.
          </Fact>
        </div>
      </Card>
    </div>
  );
}
