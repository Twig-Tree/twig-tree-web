import { Check, Circle, LockKeyhole, Play, Sparkles } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { LearningCheckpointNode as LearningCheckpointNodeType } from "../model/graphTypes";
import type {
  LearningCheckpointKind,
  LearningCheckpointStatus,
} from "../model/types";

const kindLabels: Record<LearningCheckpointKind, string> = {
  core: "핵심",
  supplemental: "보충",
  advanced: "심화",
};

const statusLabels: Record<LearningCheckpointStatus, string> = {
  completed: "완료",
  current: "학습 중",
  available: "학습 가능",
  locked: "선수 학습 필요",
};

const statusIcons = {
  completed: Check,
  current: Play,
  available: Circle,
  locked: LockKeyhole,
} satisfies Record<LearningCheckpointStatus, typeof Circle>;

export function LearningCheckpointNode({
  data,
}: NodeProps<LearningCheckpointNodeType>) {
  const { checkpoint, status, onSelect } = data;
  const StatusIcon = statusIcons[status];

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="learning-path-node__handle"
      />

      <button
        type="button"
        data-status={status}
        data-kind={checkpoint.kind}
        aria-label={`${checkpoint.title}, ${kindLabels[checkpoint.kind]}, ${statusLabels[status]}`}
        onClick={() => onSelect(checkpoint.id)}
        className="learning-path-node nodrag nopan flex h-full w-full flex-col items-start gap-3 rounded-[inherit] p-4 text-left"
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="learning-path-node__kind inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] leading-none font-semibold tracking-wide">
            {checkpoint.kind !== "core" ? (
              <Sparkles aria-hidden="true" className="size-3" />
            ) : null}
            {kindLabels[checkpoint.kind]}
          </span>
          <span className="learning-path-node__status inline-flex items-center gap-1 text-[11px] font-medium">
            <StatusIcon aria-hidden="true" className="size-3.5" />
            {statusLabels[status]}
          </span>
        </span>

        <span className="text-sm leading-5 font-semibold text-slate-800">
          {checkpoint.title}
        </span>
      </button>

      <Handle
        type="source"
        position={Position.Right}
        className="learning-path-node__handle"
      />
    </>
  );
}
