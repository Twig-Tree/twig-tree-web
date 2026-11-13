import {
  NODE_ACTION_ENTRY_LABELS,
  NODE_ACTION_LABELS,
} from "../model/nodeActions";
import { type NodeActionLogEntry } from "../model/useLabNodeActions";

type LabActionLogProps = {
  log: NodeActionLogEntry[]; // 최근 실행이 앞에 온다
  onClear: () => void;
};

/*
함수 이름 : LabActionLog
기능 : 어떤 진입점으로 어느 노드에 어떤 동작을 실행했는지, 막혔다면 그 이유를 최근 순서로 보여 준다.
인자 : LabActionLogProps
반환값 : 실행 기록 목록
*/
export function LabActionLog({ log, onClear }: LabActionLogProps) {
  return (
    <section
      aria-labelledby="node-action-lab-log"
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <h3
          id="node-action-lab-log"
          className="text-xs font-bold text-content-secondary"
        >
          실행 기록
        </h3>
        <button
          type="button"
          onClick={onClear}
          disabled={log.length === 0}
          className="rounded-control px-2 py-1 text-xs text-content-secondary hover:bg-surface-hover disabled:text-content-disabled disabled:hover:bg-transparent"
        >
          비우기
        </button>
      </div>

      {log.length === 0 ? (
        <p className="text-xs text-content-muted">
          노드에 동작을 실행하면 여기에 남습니다.
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {log.map((item) => (
            <li
              key={item.id}
              className="rounded-control border border-line bg-surface px-2 py-1.5 text-xs"
            >
              <p className="text-content">
                <span className="font-bold">
                  {NODE_ACTION_ENTRY_LABELS[item.entry]}
                </span>
                {" · "}
                {NODE_ACTION_LABELS[item.actionId]}
                {" · "}
                <span className="text-content-secondary">{item.nodeLabel}</span>
              </p>
              {item.blockReason ? (
                <p className="text-danger">막힘: {item.blockReason}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
