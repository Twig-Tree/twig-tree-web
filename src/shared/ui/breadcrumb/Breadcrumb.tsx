export interface BreadcrumbProps {
  items: readonly string[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase text-slate-400">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-center gap-2">
            {/** &rsaquo; : '›' 문자를 html 문법과 헷갈리지 않도록 html 엔터티로 표현 */}
            {index > 0 ? <span aria-hidden="true">&rsaquo;</span> : null}
            <span
              className={
                index === items.length - 1 ? "text-indigo-500" : undefined
              }
              aria-current={index === items.length - 1 ? "page" : undefined}
            >
              {item}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
