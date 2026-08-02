import { Construction } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';

/**
 * One component for every not-yet-built section. Replaces PlaceholderA/B/C,
 * which were byte-for-byte identical files. The section title now comes from
 * the route, so the page and the sidebar agree on what you clicked.
 */
export default function ComingSoon({ title }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="rounded-full bg-primary-soft p-4 text-primary">
          <Construction size={32} aria-hidden="true" />
        </div>
        <p className="text-lg text-content-muted">این بخش به زودی اضافه خواهد شد.</p>
        <p className="text-sm text-content-subtle">در حال حاضر داده‌ای برای نمایش وجود ندارد.</p>
      </Card>
    </div>
  );
}
