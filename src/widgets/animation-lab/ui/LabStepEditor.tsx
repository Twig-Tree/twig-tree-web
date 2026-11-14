import { X } from "lucide-react";
import {
  MAX_LECTURE_BADGE_LABEL_LENGTH,
  type LectureAnimationAction,
  getLectureActionNodeIds,
  getLectureActionWithNodeIds,
} from "@/src/entities/lecture";
import { IconButton } from "@/src/shared/ui/icon-button";
import { ANIMATION_LAB_TREE } from "../model/fixtureTree";
import { type LabStep } from "../model/labTimeline";
import { validateLabAction } from "../model/validateLabStep";

type LabStepEditorProps = {
  step: LabStep; // 고칠 단계
  onChangeAction: (action: LectureAnimationAction) => void; // 고친 동작을 타임라인에 반영한다
};

const FIELD_CLASS =
  "h-9 w-full rounded-control border border-line bg-surface px-2 text-sm text-content";

const NODE_FIELD_LABELS: Record<LectureAnimationAction["type"], string> = {
  focus: "화면에 모을 노드",
  highlight: "강조할 노드",
  dim: "흐리지 않을 노드",
  trace: "따라갈 경로 (부모 → 자식)",
  badge: "꼬리표를 붙일 노드",
  grow: "자라기 시작할 노드",
  collapse: "자식을 접을 노드",
  expand: "자식을 펼칠 노드",
  reset: "",
  wait: "",
};

const labelByNodeId = new Map(
  ANIMATION_LAB_TREE.map((node) => [node.id, node.label]),
);

/*
함수 이름 : LabStepEditor
기능 : 선택한 단계의 대상 노드와 동작 값을 고친다. 대상은 캔버스에서 노드를 클릭해 고른다.
인자 : LabStepEditorProps
반환값 : 단계 편집 폼
*/
export function LabStepEditor({ step, onChangeAction }: LabStepEditorProps) {
  const { action } = step;
  const nodeIds = getLectureActionNodeIds(action);
  const issue = validateLabAction(action, ANIMATION_LAB_TREE);

  return (
    <div className="flex flex-col gap-3 rounded-control border border-line bg-surface p-3">
      {nodeIds !== null ? (
        <div>
          <p className="text-xs font-semibold text-content-secondary">
            {NODE_FIELD_LABELS[action.type]}
          </p>
          <p className="mt-0.5 text-xs text-content-muted">
            캔버스에서 노드를 클릭해 넣고 뺍니다.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {nodeIds.map((nodeId) => (
              <li
                key={nodeId}
                className="flex items-center gap-0.5 rounded-control bg-accent-subtle py-0.5 pl-2 text-xs font-medium text-accent"
              >
                {labelByNodeId.get(nodeId) ?? nodeId}
                <IconButton
                  size="sm"
                  aria-label={`${labelByNodeId.get(nodeId) ?? nodeId} 빼기`}
                  className="!h-6 !w-6"
                  onClick={() =>
                    onChangeAction(
                      getLectureActionWithNodeIds(
                        action,
                        nodeIds.filter((id) => id !== nodeId),
                      ),
                    )
                  }
                >
                  <X />
                </IconButton>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {action.type !== "reset" ? (
          <label className="text-xs font-semibold text-content-secondary">
            시간 (ms)
            <input
              type="number"
              min={0}
              step={100}
              value={action.durationMs}
              className={`mt-1 ${FIELD_CLASS}`}
              onChange={(event) =>
                onChangeAction({
                  ...action,
                  durationMs: Math.max(0, Number(event.target.value)),
                })
              }
            />
          </label>
        ) : null}

        {action.type === "focus" ? (
          <label className="text-xs font-semibold text-content-secondary">
            최대 배율
            <input
              type="number"
              min={0.3}
              step={0.1}
              value={action.maxZoom}
              className={`mt-1 ${FIELD_CLASS}`}
              onChange={(event) =>
                onChangeAction({
                  ...action,
                  maxZoom: Number(event.target.value),
                })
              }
            />
          </label>
        ) : null}

        {action.type === "highlight" ? (
          <label className="text-xs font-semibold text-content-secondary">
            모양
            <select
              value={action.style}
              className={`mt-1 ${FIELD_CLASS}`}
              onChange={(event) =>
                onChangeAction({
                  ...action,
                  style: event.target.value as
                    | "steady"
                    | "pulse"
                    | "pop"
                    | "bounce"
                    | "shake"
                    | "sparkle",
                })
              }
            >
              <option value="steady">steady</option>
              <option value="pulse">pulse</option>
              <option value="pop">pop</option>
              <option value="bounce">bounce</option>
              <option value="shake">shake</option>
              <option value="sparkle">sparkle</option>
            </select>
          </label>
        ) : null}

        {action.type === "badge" ? (
          <label className="text-xs font-semibold text-content-secondary">
            꼬리표 글자
            <input
              type="text"
              maxLength={MAX_LECTURE_BADGE_LABEL_LENGTH}
              value={action.label}
              className={`mt-1 ${FIELD_CLASS}`}
              onChange={(event) =>
                onChangeAction({ ...action, label: event.target.value })
              }
            />
          </label>
        ) : null}

        {action.type === "highlight" || action.type === "badge" ? (
          <label className="text-xs font-semibold text-content-secondary">
            색상 역할
            <select
              value={action.tone ?? "accent"}
              className={`mt-1 ${FIELD_CLASS}`}
              onChange={(event) =>
                onChangeAction({
                  ...action,
                  tone: event.target.value as
                    | "accent"
                    | "success"
                    | "warning"
                    | "danger",
                })
              }
            >
              <option value="accent">accent</option>
              <option value="success">success</option>
              <option value="warning">warning</option>
              <option value="danger">danger</option>
            </select>
          </label>
        ) : null}

        {action.type === "trace" ? (
          <>
            <label className="text-xs font-semibold text-content-secondary">
              진행 방식
              <select
                value={action.mode ?? "simultaneous"}
                className={`mt-1 ${FIELD_CLASS}`}
                onChange={(event) =>
                  onChangeAction({
                    ...action,
                    mode: event.target.value as "simultaneous" | "progressive",
                  })
                }
              >
                <option value="simultaneous">동시</option>
                <option value="progressive">순차</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-content-secondary">
              진행 방향
              <select
                value={action.direction ?? "forward"}
                className={`mt-1 ${FIELD_CLASS}`}
                onChange={(event) =>
                  onChangeAction({
                    ...action,
                    direction: event.target.value as "forward" | "reverse",
                  })
                }
              >
                <option value="forward">부모 → 자식</option>
                <option value="reverse">자식 → 부모</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-content-secondary">
              모양
              <select
                value={action.style ?? "dash"}
                className={`mt-1 ${FIELD_CLASS}`}
                onChange={(event) =>
                  onChangeAction({
                    ...action,
                    style: event.target.value as "dash" | "comet",
                  })
                }
              >
                <option value="dash">흐르는 점선</option>
                <option value="comet">혜성</option>
              </select>
            </label>
          </>
        ) : null}

        {action.type === "reset" ? (
          <label className="col-span-2 text-xs font-semibold text-content-secondary">
            되돌릴 범위
            <select
              value={action.scope}
              className={`mt-1 ${FIELD_CLASS}`}
              onChange={(event) =>
                onChangeAction({
                  ...action,
                  scope: event.target.value as "visual" | "camera" | "all",
                })
              }
            >
              <option value="visual">시각 효과</option>
              <option value="camera">카메라</option>
              <option value="all">전부</option>
            </select>
          </label>
        ) : null}
      </div>

      {action.type === "highlight" ||
      action.type === "dim" ||
      action.type === "trace" ||
      action.type === "badge" ? (
        <label className="flex items-center gap-2 text-xs font-medium text-content-secondary">
          <input
            type="checkbox"
            checked={action.persist ?? false}
            onChange={(event) =>
              onChangeAction({ ...action, persist: event.target.checked })
            }
          />
          reset 전까지 유지 (persist)
        </label>
      ) : null}

      {issue ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {issue}
        </p>
      ) : null}
    </div>
  );
}
