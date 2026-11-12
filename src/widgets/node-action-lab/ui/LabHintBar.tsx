import {
  NODE_ACTION_IDS,
  NODE_ACTION_LABELS,
  type NodeActionId,
} from "../model/nodeActions";
import { type NodeActionShortcuts } from "../model/shortcuts";

type LabHintBarProps = {
  shortcuts: NodeActionShortcuts;
  getBlockReason: (actionId: NodeActionId) => string | null; // 선택된 노드에 막힌 동작은 흐리게 적는다
  showGuideHint: boolean; // ? 안내를 열 수 있으면 마지막에 함께 적는다
};

/*
함수 이름 : LabHintBar
기능 : 선택된 노드에 쓸 수 있는 단축키를 캔버스 아래에 한 줄로 보여 준다. 막힌 동작은 흐리게 두고 이유를 title로 단다.
인자 : LabHintBarProps
반환값 : 단축키 힌트 줄
*/
export function LabHintBar({
  shortcuts,
  getBlockReason,
  showGuideHint,
}: LabHintBarProps) {
  return (
    <div
      aria-label="선택한 노드의 단축키"
      className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-control border border-line bg-surface px-3 py-1.5 text-xs text-content-secondary shadow-overlay"
    >
      {NODE_ACTION_IDS.map((actionId) => {
        const blockReason = getBlockReason(actionId);

        return (
          <span
            key={actionId}
            title={blockReason ?? undefined}
            className={blockReason ? "text-content-disabled" : undefined}
          >
            <kbd className="mr-1 rounded-control border border-line px-1 font-sans text-content">
              {shortcuts[actionId].label}
            </kbd>
            {NODE_ACTION_LABELS[actionId]}
          </span>
        );
      })}
      {showGuideHint ? (
        <span>
          <kbd className="mr-1 rounded-control border border-line px-1 font-sans text-content">
            ?
          </kbd>
          전체 단축키
        </span>
      ) : null}
    </div>
  );
}
