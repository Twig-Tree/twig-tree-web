import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase text-slate-400">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-2"
          >
            {index > 0 ? <span aria-hidden="true">&rsaquo;</span> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-slate-700 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-indigo-500" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
