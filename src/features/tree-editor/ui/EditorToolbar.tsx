import { useMemo, type ComponentProps, type ReactNode, type Ref } from "react";
import { Minus, Plus, Redo2, Scan, Undo2, type LucideIcon } from "lucide-react";

export type EditorToolbarGroupId = "history" | "view" | "level";

const EDITOR_TOOLBAR_GROUP_IDS: readonly EditorToolbarGroupId[] = [
  "history",
  "view",
  "level",
];

type EditorToolbarProps = {
  onUndo: () => void; // 직전 편집을 되돌린다.
  onRedo: () => void; // 되돌린 편집을 다시 실행한다.
  onFitView: () => void; // 트리 전체를 화면에 맞춘다.
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  treeLevel: number | null; // 지금 보이는 가장 깊은 계층. 루트가 1이고, 접고 펼칠 트리가 없으면 null
  onCollapseLevel: () => void; // 보이는 계층을 한 단계 줄인다.
  onExpandLevel: () => void; // 보이는 계층을 한 단계 늘린다.
  isCollapseLevelDisabled: boolean;
  isExpandLevelDisabled: boolean;
  toolbarRef?: Ref<HTMLDivElement>; // 도구 모음 요소. 기능 안내가 카드를 여기에 맞춘다
  /*
  버튼 묶음 요소가 붙거나 떨어질 때 부른다. 기능 안내처럼 묶음을 가리켜야 하는 쪽이 요소를 받는다.
  렌더마다 바뀌면 묶음 ref가 매번 다시 불리므로 고정된 함수를 넘긴다.
  */
  onGroupElementChange?: (
    groupId: EditorToolbarGroupId,
    element: HTMLDivElement | null,
  ) => void;
};

type ToolbarButtonProps = ComponentProps<"button"> & {
  icon: LucideIcon;
  label: string; // 버튼 이름. 글자가 숨겨져도 aria-label과 툴팁으로 남는다.
  isIconOnly?: boolean;
};

function ToolbarButton({
  icon: Icon,
  label,
  isIconOnly = false,
  className,
  ...buttonProps
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-control text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:pointer-events-none ${
        isIconOnly ? "w-8" : "min-w-8 px-2"
      } text-content-secondary hover:bg-surface-hover hover:text-content disabled:text-content-disabled ${className ?? ""}`}
      {...buttonProps}
    >
      <Icon aria-hidden className="size-4" strokeWidth={2} />
      {/*
      캔버스가 좁으면 툴바가 왼쪽 패널 밑으로 넘치므로, 캔버스 폭(@container)이 충분할 때만 글자를 보인다.
      */}
      {isIconOnly ? null : <span className="hidden @2xl:inline">{label}</span>}
    </button>
  );
}

function ToolbarGroup({
  children,
  ref,
}: {
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className="flex items-center gap-0.5">
      {children}
    </div>
  );
}

function ToolbarDivider() {
  return <div aria-hidden className="mx-1 h-5 w-px bg-line" />;
}

/*
함수 이름 : EditorToolbar
기능 : 트리 편집기의 기록·화면·계층 조절 버튼을 한 줄의 도구 모음으로 그린다. 버튼이 하는 일은 호출부가 정한다.
인자 : EditorToolbarProps
반환값 : 편집기 도구 모음
*/
export function EditorToolbar({
  onUndo,
  onRedo,
  onFitView,
  isUndoDisabled,
  isRedoDisabled,
  treeLevel,
  onCollapseLevel,
  onExpandLevel,
  isCollapseLevelDisabled,
  isExpandLevelDisabled,
  toolbarRef,
  onGroupElementChange,
}: EditorToolbarProps) {
  /*
  묶음별 ref 콜백을 한 번만 만든다. 렌더마다 새 함수가 되면 React가 null과 요소로 다시 부르고, 받는 쪽이 state를 바꾸면 다시 렌더된다.
  묶음마다 따로 꺼내 둔다. 객체의 속성으로 ref에 넘기면 lint가 그 객체를 ref로 보고 다음 속성 읽기를 render 중 ref 접근으로 잡는다.
  */
  const {
    history: setHistoryGroupElement,
    view: setViewGroupElement,
    level: setLevelGroupElement,
  } = useMemo(
    () =>
      Object.fromEntries(
        EDITOR_TOOLBAR_GROUP_IDS.map((groupId) => [
          groupId,
          (element: HTMLDivElement | null) =>
            onGroupElementChange?.(groupId, element),
        ]),
      ) as Record<
        EditorToolbarGroupId,
        (element: HTMLDivElement | null) => void
      >,
    [onGroupElementChange],
  );

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="트리 편집 도구"
      data-camera-inset="top"
      className="flex items-center rounded-card border border-line bg-surface p-1 shadow-control"
    >
      <ToolbarGroup ref={setHistoryGroupElement}>
        <ToolbarButton
          icon={Undo2}
          label="되돌리기"
          isIconOnly
          onClick={onUndo}
          disabled={isUndoDisabled}
        />
        <ToolbarButton
          icon={Redo2}
          label="다시 실행"
          isIconOnly
          onClick={onRedo}
          disabled={isRedoDisabled}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup ref={setViewGroupElement}>
        <ToolbarButton icon={Scan} label="전체 보기" onClick={onFitView} />
      </ToolbarGroup>

      {treeLevel !== null ? (
        <>
          <ToolbarDivider />

          <ToolbarGroup ref={setLevelGroupElement}>
            <ToolbarButton
              icon={Minus}
              label="한 계층 접기"
              isIconOnly
              onClick={onCollapseLevel}
              disabled={isCollapseLevelDisabled}
            />
            <span
              role="status"
              aria-label={`${treeLevel}계층까지 보임`}
              className="min-w-6 text-center text-[13px] font-medium whitespace-nowrap text-content-secondary tabular-nums"
            >
              <span className="hidden @2xl:inline">계층 </span>
              {treeLevel}
            </span>
            <ToolbarButton
              icon={Plus}
              label="한 계층 펼치기"
              isIconOnly
              onClick={onExpandLevel}
              disabled={isExpandLevelDisabled}
            />
          </ToolbarGroup>
        </>
      ) : null}
    </div>
  );
}
