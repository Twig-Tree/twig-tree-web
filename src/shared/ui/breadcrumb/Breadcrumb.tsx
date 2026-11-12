import Link from "next/link";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  href?: string; // 이동할 경로. 지정하면 링크로 표시한다
  label: string; // 표시할 이름
  onClick?: () => void; // 선택 시 실행할 callback. 지정하면 버튼으로 표시한다
}

export interface BreadcrumbProps<T extends BreadcrumbItem = BreadcrumbItem> {
  items: readonly T[]; // 표시할 경로. 호출부가 필드를 더한 항목을 넘기면 renderItem에서 그대로 받는다
  /*
  항목의 링크·버튼을 감쌀 때 쓴다. 놓을 수 있는 곳처럼 shared가 모르는 동작을 호출부가 붙인다. 없으면 그대로 그린다.
  */
  renderItem?: (item: T, content: ReactNode) => ReactNode;
}

const INTERACTIVE_ITEM_CLASS_NAME =
  "transition-colors hover:text-content-secondary hover:underline";

/*
함수 이름 : Breadcrumb
기능 : 현재 위치까지의 경로를 나열하고, 각 항목을 링크 또는 버튼으로 표시한다.
인자 : BreadcrumbProps<T>
반환값 : 경로를 표시하는 nav 요소

href는 페이지 이동에, onClick은 팝업 안에서처럼 화면 이동 없이 위치만 바꿀 때 사용한다.
둘 다 없는 항목은 현재 위치로 표시한다.
*/
export function Breadcrumb<T extends BreadcrumbItem>({
  items,
  renderItem,
}: BreadcrumbProps<T>) {
  return (
    <nav aria-label="현재 위치">
      <ol className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase text-content-muted">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-2"
          >
            {index > 0 ? <span aria-hidden="true">&rsaquo;</span> : null}
            {renderItem ? (
              renderItem(item, <BreadcrumbItemContent item={item} />)
            ) : (
              <BreadcrumbItemContent item={item} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbItemContentProps {
  item: BreadcrumbItem; // 그릴 경로 항목
}

/*
함수 이름 : BreadcrumbItemContent
기능 : 경로 항목 하나를 링크, 버튼, 현재 위치 중 하나로 그린다.
인자 : BreadcrumbItemContentProps
반환값 : 경로 항목 요소
*/
function BreadcrumbItemContent({ item }: BreadcrumbItemContentProps) {
  return item.href ? (
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
    <span className="text-accent" aria-current="page">
      {item.label}
    </span>
  );
}
