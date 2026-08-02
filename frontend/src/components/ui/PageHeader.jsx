/**
 * Page title row. Every page previously repeated
 * `text-2xl font-bold mb-4 text-gray-900`.
 */
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-content">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-content-subtle">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
