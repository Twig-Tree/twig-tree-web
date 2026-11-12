import { type KeyboardEvent } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import {
  type ToolbarPosition,
  type ToolbarStyle,
  type TooltipContent,
} from "../model/config";
import { type ToolbarTarget } from "../model/getToolbarTargets";
import {
  NODE_ACTION_IDS,
  NODE_ACTION_LABELS,
  type NodeActionId,
} from "../model/nodeActions";
import { type NodeActionShortcuts } from "../model/shortcuts";
import { NODE_ACTION_ICONS } from "./nodeActionIcons";

const TOOLBAR_POSITIONS: Record<ToolbarPosition, Position> = {
  right: Position.Right,
  bottom: Position.Bottom,
  top: Position.Top,
};

/*
노드와 버튼 사이의 간격(px). 아래쪽은 노드 밑으로 튀어나온 접기 버튼을 피해 더 띄운다.
*/
const TOOLBAR_OFFSETS: Record<ToolbarPosition, number> = {
  right: 10,
  bottom: 18,
  top: 10,
};

type LabNodeToolbarProps = {
  target: ToolbarTarget; // 버튼을 붙일 노드와 버튼이 보인 이유
  position: ToolbarPosition;
  buttonStyle: ToolbarStyle;
  tooltip: TooltipContent;
  shortcuts: NodeActionShortcuts; // 툴팁에 적을 단축키
  getBlockReason: (actionId: NodeActionId) => string | null;
  onRunAction: (actionId: NodeActionId) => void; // 막힌 동작도 부른다. 실행 기록에 막힌 이유를 남기기 위해서다
  /*
  버튼에 마우스가 들어오면 호버 상태를 붙잡는다. React Flow가 노드에서 mouseleave를 쓰므로 같은 mouse 이벤트를 쓴다.
  pointer 이벤트는 mouse 이벤트보다 먼저 와서, 버튼의 pointerenter가 노드의 mouseleave보다 먼저 처리되고 버튼이 사라진다.
  */
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

/*
함수 이름 : LabNodeToolbar
기능 : 노드 옆에 동작 버튼을 붙인다. 막힌 동작은 누를 수 있게 두되 비활성으로 보이고, 툴팁에 이유를 적는다.
툴팁은 마우스를 올렸을 때와 키보드 focus가 들어왔을 때 함께 보인다.
인자 : LabNodeToolbarProps
반환값 : 노드 옆 동작 버튼 묶음

NodeToolbar는 캔버스를 확대해도 크기가 그대로이고, ReactFlow의 자식으로 두면 nodeId로 노드를 가리킬 수 있어
제품 CustomNode를 고치지 않고 붙일 수 있다. disabled 대신 aria-disabled를 쓰는 이유는 비활성 버튼이 focus를 받지 못해
키보드 사용자가 막힌 이유를 들을 수 없기 때문이다.
*/
export function LabNodeToolbar({
  target,
  position,
  buttonStyle,
  tooltip,
  shortcuts,
  getBlockReason,
  onRunAction,
  onMouseEnter,
  onMouseLeave,
}: LabNodeToolbarProps) {
  const tooltipSide =
    position === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5"; // 노드 반대쪽으로 띄워 노드를 가리지 않게 한다

  /*
  버튼 묶음 안에서는 ←→로 오가고 Home·End로 양 끝에 간다. Escape와 Shift+Tab은 버튼을 띄운 노드로 focus를 돌려준다.
  버튼은 모든 노드 뒤에 그려지므로 Shift+Tab을 그대로 두면 마지막 노드로 가 버린다.
  */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" || (event.key === "Tab" && event.shiftKey)) {
      const nodeTitle = document.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${CSS.escape(target.clientId)}"] .custom-node__content`,
      );
      if (!nodeTitle) return;

      event.preventDefault();
      event.stopPropagation();
      nodeTitle.focus();
      return;
    }

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
    );
    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const nextIndex = {
      ArrowRight: (currentIndex + 1) % buttons.length,
      ArrowLeft: (currentIndex - 1 + buttons.length) % buttons.length,
      Home: 0,
      End: buttons.length - 1,
    }[event.key];
    if (nextIndex === undefined) return;

    event.preventDefault();
    buttons[nextIndex].focus();
  };

  return (
    <NodeToolbar
      nodeId={target.clientId}
      isVisible
      /*
      NodeToolbar는 z-index를 노드 z + 1(보통 1)로 정하는데, 노드가 든 viewport 층은 2라 이웃 노드와 겹치면 노드 밑으로 들어가
      마우스가 이웃 노드에 잡힌다. 노드보다 위, 캔버스 패널(5)보다는 아래에 둔다.
      */
      style={{ zIndex: 4 }}
      position={TOOLBAR_POSITIONS[position]}
      offset={TOOLBAR_OFFSETS[position]}
      className="nodrag nopan nowheel"
    >
      <div
        role="toolbar"
        aria-label="노드 동작"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={handleKeyDown}
        className="flex gap-1 rounded-control border border-line bg-surface p-1 shadow-overlay"
      >
        {NODE_ACTION_IDS.map((actionId) => {
          const Icon = NODE_ACTION_ICONS[actionId];
          const label = NODE_ACTION_LABELS[actionId];
          const blockReason = getBlockReason(actionId);
          const isBlocked = blockReason !== null;
          const tooltipId = `node-action-tooltip-${target.clientId}-${actionId}`;

          return (
            <span key={actionId} className="group relative">
              <button
                type="button"
                aria-label={buttonStyle === "icon" ? label : undefined}
                aria-disabled={isBlocked || undefined}
                aria-describedby={tooltip === "off" ? undefined : tooltipId}
                /*
                마우스로 누를 때는 focus를 가져오지 않는다. 가져오면 focus가 버튼에 남아 그 뒤의 단축키가 노드가 아니라 버튼으로 가고,
                Enter·Space는 방금 누른 버튼을 다시 누른다. 키보드로 들어온 경우에는 focus가 이미 버튼에 있다.
                */
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onRunAction(actionId)}
                className={`flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-control px-2 text-xs font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled aria-disabled:hover:bg-transparent ${
                  actionId === "delete"
                    ? "text-danger hover:bg-danger-subtle"
                    : "text-content-secondary hover:bg-surface-hover"
                }`}
              >
                <Icon aria-hidden className="size-4" strokeWidth={2} />
                {buttonStyle === "iconLabel" ? label : null}
              </button>

              {tooltip === "off" ? null : (
                <span
                  id={tooltipId}
                  role="tooltip"
                  className={`pointer-events-none invisible absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center rounded-control bg-inverse px-2 py-1 text-xs whitespace-nowrap text-on-inverse shadow-overlay group-focus-within:visible group-hover:visible ${tooltipSide}`}
                >
                  <span>
                    {label}
                    {tooltip === "labelShortcut" ? (
                      <kbd className="ml-2 font-sans opacity-70">
                        {shortcuts[actionId].label}
                      </kbd>
                    ) : null}
                  </span>
                  {blockReason ? (
                    <span className="opacity-80">{blockReason}</span>
                  ) : null}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </NodeToolbar>
  );
}
