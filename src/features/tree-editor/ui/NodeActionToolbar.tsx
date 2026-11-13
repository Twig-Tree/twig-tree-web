import { type KeyboardEvent } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { NODE_ACTION_LABELS } from "../constants/nodeActions";
import {
  getNodeActionShortcuts,
  NODE_ACTION_IDS,
  type NodeActionId,
} from "../lib/shortcuts/nodeActionShortcuts";
import { useDevicePlatform } from "../model/shortcuts/useDevicePlatform";
import { NODE_ACTION_ICONS } from "./nodeActionIcons";

/*
노드와 버튼 사이의 간격(px). 노드 밑으로 튀어나온 접기 버튼을 피해 띄운다.
*/
const TOOLBAR_OFFSET = 18;

type NodeActionToolbarProps = {
  clientId: string; // 버튼을 붙일 노드의 편집기 노드 ID
  blockReasons: Record<NodeActionId, string | null>; // 동작별 막힌 이유. 실행할 수 있으면 null
  onRunAction: (actionId: NodeActionId) => void; // 막힌 동작도 부른다. 막을지는 useNodeActions가 정한다
};

/*
함수 이름 : NodeActionToolbar
기능 : 선택한 노드 아래에 메모 열기·자식 추가·이름 편집·삭제 아이콘 버튼을 붙인다.
툴팁에 동작 이름과 이 기기의 단축키를, 막혔으면 이유를 함께 적는다. 툴팁은 마우스를 올렸을 때와 키보드 focus가 들어왔을 때 보인다.
인자 : NodeActionToolbarProps
반환값 : 노드 아래 동작 버튼 묶음

NodeToolbar는 캔버스를 확대해도 크기가 그대로이고 nodeId로 노드를 가리켜 CustomNode를 고치지 않고 붙일 수 있다.
disabled 대신 aria-disabled를 쓰는 이유는 비활성 버튼이 focus를 받지 못해 키보드 사용자가 막힌 이유를 들을 수 없기 때문이다.
*/
export function NodeActionToolbar({
  clientId,
  blockReasons,
  onRunAction,
}: NodeActionToolbarProps) {
  const shortcuts = getNodeActionShortcuts(useDevicePlatform());

  /*
  버튼 묶음 안에서는 ←→로 오가고 Home·End로 양 끝에 간다. Escape와 Shift+Tab은 버튼을 띄운 노드로 focus를 돌려준다.
  버튼은 모든 노드 뒤에 그려지므로 Shift+Tab을 그대로 두면 마지막 노드로 가 버린다.
  */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" || (event.key === "Tab" && event.shiftKey)) {
      const nodeTitle = document.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${CSS.escape(clientId)}"] .custom-node__content`,
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
      nodeId={clientId}
      isVisible
      /*
      NodeToolbar는 z-index를 노드 z + 1(보통 1)로 정하는데, 노드가 든 viewport 층은 2라 이웃 노드와 겹치면 노드 밑으로 들어가
      마우스가 이웃 노드에 잡힌다. 노드보다 위, 캔버스 패널(5)보다는 아래에 둔다.
      */
      style={{ zIndex: 4 }}
      position={Position.Bottom}
      offset={TOOLBAR_OFFSET}
      className="nodrag nopan nowheel"
    >
      <div
        role="toolbar"
        aria-label="노드 동작"
        onKeyDown={handleKeyDown}
        className="flex gap-1 rounded-control border border-line bg-surface p-1 shadow-overlay"
      >
        {NODE_ACTION_IDS.map((actionId) => {
          const Icon = NODE_ACTION_ICONS[actionId];
          const label = NODE_ACTION_LABELS[actionId];
          const blockReason = blockReasons[actionId];
          const tooltipId = `node-action-tooltip-${clientId}-${actionId}`;

          return (
            <span key={actionId} className="group relative">
              <button
                type="button"
                aria-label={label}
                aria-disabled={blockReason !== null || undefined}
                aria-describedby={tooltipId}
                aria-keyshortcuts={shortcuts[actionId].keys
                  .map((key) => (key === " " ? "Space" : key))
                  .join(" ")}
                /*
                마우스로 누를 때는 focus를 가져오지 않는다. 가져오면 focus가 버튼에 남아 그 뒤의 단축키가 노드가 아니라 버튼으로 가고,
                Enter·Space는 방금 누른 버튼을 다시 누른다. 키보드로 들어온 경우에는 focus가 이미 버튼에 있다.
                */
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onRunAction(actionId)}
                className={`flex size-8 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled aria-disabled:hover:bg-transparent ${
                  actionId === "delete"
                    ? "text-danger hover:bg-danger-subtle"
                    : "text-content-secondary hover:bg-surface-hover"
                }`}
              >
                <Icon aria-hidden className="size-4" strokeWidth={2} />
              </button>

              {/*
              툴팁은 버튼 묶음 아래에 띄워 노드를 가리지 않는다.
              */}
              <span
                id={tooltipId}
                role="tooltip"
                className="pointer-events-none invisible absolute top-full left-1/2 z-10 mt-1.5 flex -translate-x-1/2 flex-col items-center rounded-control bg-inverse px-2 py-1 text-xs whitespace-nowrap text-on-inverse shadow-overlay group-focus-within:visible group-hover:visible"
              >
                <span>
                  {label}
                  <kbd className="ml-2 font-sans opacity-70">
                    {shortcuts[actionId].label}
                  </kbd>
                </span>
                {blockReason ? (
                  <span className="opacity-80">{blockReason}</span>
                ) : null}
              </span>
            </span>
          );
        })}
      </div>
    </NodeToolbar>
  );
}
