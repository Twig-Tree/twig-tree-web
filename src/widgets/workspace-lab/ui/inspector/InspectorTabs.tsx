import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export type InspectorTab<T extends string> = {
  id: T;
  label: string;
  content: ReactNode;
};

type InspectorTabsProps<T extends string> = {
  tabs: ReadonlyArray<InspectorTab<T>>;
  activeTab: T; // 현재 펼친 탭
  onActiveTabChange: (tab: T) => void;
};

/*
함수 이름 : InspectorTabs
기능 : Inspector 구획을 탭으로 나눠 그린다. 숨긴 탭도 마운트를 유지해 펼쳐 둔 세부 설정이 탭을 오가도 남는다.
인자 : InspectorTabsProps
반환값 : 탭 목록과 탭 패널
*/
export function InspectorTabs<T extends string>({
  tabs,
  activeTab,
  onActiveTabChange,
}: InspectorTabsProps<T>) {
  const baseId = useId();
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());

  /*
  WAI-ARIA 탭 패턴을 따라 좌우 화살표와 Home·End로 탭을 옮기고 포커스도 함께 옮긴다.
  */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = {
      ArrowRight: (currentIndex + 1) % tabs.length,
      ArrowLeft: (currentIndex - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex].id;
    onActiveTabChange(nextTab);
    tabRefs.current.get(nextTab)?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Inspector 설정 묶음"
        onKeyDown={handleKeyDown}
        className="grid shrink-0 border-b border-slate-200 px-3"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(element) => {
                if (element) tabRefs.current.set(tab.id, element);
                else tabRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onActiveTabChange(tab.id)}
              className="-mb-px border-b-2 border-transparent px-2 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 aria-selected:border-indigo-600 aria-selected:font-semibold aria-selected:text-indigo-600"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== activeTab}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"
        >
          {tab.content}
        </div>
      ))}
    </>
  );
}
