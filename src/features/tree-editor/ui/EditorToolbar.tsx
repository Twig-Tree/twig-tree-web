import type { ComponentProps, ReactNode } from "react";
import {
  Plus,
  Redo2,
  Scan,
  StickyNote,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react";

type EditorToolbarProps = {
  onUndo: () => void; // 직전 편집을 되돌린다.
  onRedo: () => void; // 되돌린 편집을 다시 실행한다.
  onFitView: () => void; // 트리 전체를 화면에 맞춘다.
  onAddNode: () => void; // 선택한 노드에 자식 노드를, 빈 트리면 루트 노드를 추가한다.
  onDeleteNode: () => void; // 선택한 노드를 삭제한다.
  onOpenMemo: () => void; // 선택한 노드의 메모 패널을 연다.
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  isAddNodeDisabled: boolean;
  isDeleteNodeDisabled: boolean;
  isOpenMemoDisabled: boolean;
};

type ToolbarButtonProps = ComponentProps<"button"> & {
  icon: LucideIcon;
  label: string; // 버튼 이름. 글자가 숨겨져도 aria-label과 툴팁으로 남는다.
  isIconOnly?: boolean;
  variant?: "default" | "primary" | "danger";
};

/*
잠긴 버튼은 hover에도 바뀌지 않도록 pointer 이벤트를 끈다. 강조 버튼은 글자색 대신 바탕을 잠긴 색으로 바꾼다.
*/
const VARIANT_CLASS_NAMES: Record<
  NonNullable<ToolbarButtonProps["variant"]>,
  string
> = {
  default:
    "text-content-secondary hover:bg-surface-hover hover:text-content disabled:text-content-disabled",
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover disabled:bg-accent-disabled",
  danger:
    "text-content-secondary hover:bg-danger-subtle hover:text-danger disabled:text-content-disabled",
};

function ToolbarButton({
  icon: Icon,
  label,
  isIconOnly = false,
  variant = "default",
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
      } ${VARIANT_CLASS_NAMES[variant]} ${className ?? ""}`}
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

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
  return <div aria-hidden className="mx-1 h-5 w-px bg-line" />;
}

/*
함수 이름 : EditorToolbar
기능 : 트리 편집기의 기록·화면·노드 편집 버튼을 한 줄의 도구 모음으로 그린다. 버튼이 하는 일은 호출부가 정한다.
인자 : EditorToolbarProps
반환값 : 편집기 도구 모음
*/
export function EditorToolbar({
  onUndo,
  onRedo,
  onFitView,
  onAddNode,
  onDeleteNode,
  onOpenMemo,
  isUndoDisabled,
  isRedoDisabled,
  isAddNodeDisabled,
  isDeleteNodeDisabled,
  isOpenMemoDisabled,
}: EditorToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="트리 편집 도구"
      className="flex items-center rounded-card border border-line bg-surface p-1 shadow-control"
    >
      <ToolbarGroup>
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

      <ToolbarGroup>
        <ToolbarButton icon={Scan} label="전체 보기" onClick={onFitView} />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          icon={StickyNote}
          label="메모 추가"
          onClick={onOpenMemo}
          disabled={isOpenMemoDisabled}
        />
        <ToolbarButton
          icon={Trash2}
          label="노드 삭제"
          variant="danger"
          onClick={onDeleteNode}
          disabled={isDeleteNodeDisabled}
        />
        <ToolbarButton
          icon={Plus}
          label="노드 추가"
          variant="primary"
          className="ml-1"
          onClick={onAddNode}
          disabled={isAddNodeDisabled}
        />
      </ToolbarGroup>
    </div>
  );
}
