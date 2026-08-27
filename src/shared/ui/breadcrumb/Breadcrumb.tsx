import Link from "next/link";

export interface BreadcrumbItem {
  href?: string; // 이동할 경로. 지정하면 링크로 표시한다
  label: string; // 표시할 이름
  onClick?: () => void; // 선택 시 실행할 callback. 지정하면 버튼으로 표시한다
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
}

const INTERACTIVE_ITEM_CLASS_NAME =
  "transition-colors hover:text-slate-700 hover:underline";

/*
함수 이름 : Breadcrumb
기능 : 현재 위치까지의 경로를 나열하고, 각 항목을 링크 또는 버튼으로 표시한다.
인자 : BreadcrumbProps
반환값 : 경로를 표시하는 nav 요소

href는 페이지 이동에, onClick은 팝업 안에서처럼 화면 이동 없이 위치만 바꿀 때 사용한다.
둘 다 없는 항목은 현재 위치로 표시한다.
*/
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
              <Link href={item.href} className={INTERACTIVE_ITEM_CLASS_NAME}>
                {item.label}
              </Link>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className={INTERACTIVE_ITEM_CLASS_NAME}
              >
                {item.label}
              </button>
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
