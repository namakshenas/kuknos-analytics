/**
 * Page title row. Every page previously repeated
 * `text-2xl font-bold mb-4 text-gray-900`.
 */
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-content">{title}</h2>
        {/* `muted`, not `subtle`: this is the app's only text that sits directly
            on the page background rather than on a card, and subtle would drop
            to 4.35:1 there — under AA. */}
        {description && <p className="mt-0.5 text-sm text-content-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
