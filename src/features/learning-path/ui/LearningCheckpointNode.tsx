import { Check, Circle, LockKeyhole, Play, Sparkles } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { LearningCheckpointNode as LearningCheckpointNodeType } from "../model/graphTypes";
import type {
  LearningCheckpoint,
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

interface LearningCheckpointCardProps {
  checkpoint: LearningCheckpoint;
  status: LearningCheckpointStatus;
  onSelect?: (checkpointId: string) => void;
}

/*
React Flow 노드와 UI 팔레트가 같은 체크포인트 카드를 사용한다.
그래프 밖에서는 onSelect를 생략해 상태를 설명하는 정적 표본으로 사용할 수 있다.
*/
export function LearningCheckpointCard({
  checkpoint,
  status,
  onSelect,
}: LearningCheckpointCardProps) {
  const StatusIcon = statusIcons[status];

  return (
    <button
      type="button"
      data-status={status}
      data-kind={checkpoint.kind}
      aria-label={`${checkpoint.title}, ${kindLabels[checkpoint.kind]}, ${statusLabels[status]}`}
      onClick={() => onSelect?.(checkpoint.id)}
      className="learning-path-node learning-path-card nodrag nopan flex h-[124px] w-56 flex-col items-start gap-3 rounded-lg p-4 text-left"
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
  );
}

export function LearningCheckpointNode({
  data,
}: NodeProps<LearningCheckpointNodeType>) {
  const { checkpoint, status, onSelect } = data;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="learning-path-node__handle"
      />

      <LearningCheckpointCard
        checkpoint={checkpoint}
        status={status}
        onSelect={onSelect}
      />

      <Handle
        type="source"
        position={Position.Right}
        className="learning-path-node__handle"
      />
    </>
  );
}
