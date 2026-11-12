import {
  NODE_ACTION_IDS,
  NODE_ACTION_LABELS,
  type NodeActionId,
} from "../model/nodeActions";
import { type NodeActionShortcuts } from "../model/shortcuts";

type LabHintBarProps = {
  shortcuts: NodeActionShortcuts | null; // 단축키를 끄면 null. 버튼 이동 키만 적는다
  toolbarEntryLabel: string | null; // 노드 옆 버튼으로 들어가는 키의 표기. 선택된 노드에 버튼이 붙지 않으면 null
  getBlockReason: (actionId: NodeActionId) => string | null; // 선택된 노드에 막힌 동작은 흐리게 적는다
  showGuideHint: boolean; // ? 안내를 열 수 있으면 마지막에 함께 적는다
};

const KBD_CLASS_NAME =
  "mr-1 rounded-control border border-line px-1 font-sans text-content";

/*
함수 이름 : LabHintBar
기능 : 선택된 노드에 쓸 수 있는 키를 캔버스 아래에 한 줄로 보여 준다. 막힌 동작은 흐리게 두고 이유를 title로 단다.
인자 : LabHintBarProps
반환값 : 단축키 힌트 줄. 보여 줄 키가 없으면 null
*/
export function LabHintBar({
  shortcuts,
  toolbarEntryLabel,
  getBlockReason,
  showGuideHint,
}: LabHintBarProps) {
  if (!shortcuts && !toolbarEntryLabel && !showGuideHint) return null;

  return (
    <div
      aria-label="선택한 노드의 단축키"
      className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-control border border-line bg-surface px-3 py-1.5 text-xs text-content-secondary shadow-overlay"
    >
      {toolbarEntryLabel ? (
        <span>
          <kbd className={KBD_CLASS_NAME}>{toolbarEntryLabel}</kbd>
          버튼으로 이동
        </span>
      ) : null}
      {shortcuts
        ? NODE_ACTION_IDS.map((actionId) => {
            const blockReason = getBlockReason(actionId);

            return (
              <span
                key={actionId}
                title={blockReason ?? undefined}
                className={blockReason ? "text-content-disabled" : undefined}
              >
                <kbd className={KBD_CLASS_NAME}>
                  {shortcuts[actionId].label}
                </kbd>
                {NODE_ACTION_LABELS[actionId]}
              </span>
            );
          })
        : null}
      {showGuideHint ? (
        <span>
          <kbd className={KBD_CLASS_NAME}>?</kbd>
          전체 단축키
        </span>
      ) : null}
    </div>
  );
}
