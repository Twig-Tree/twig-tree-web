import { X } from "lucide-react";

type LabMemoPanelProps = {
  nodeLabel: string; // 메모를 연 노드의 이름
  memo: string | null; // 노드의 메모. 없으면 null
  onClose: () => void;
};

/*
함수 이름 : LabMemoPanel
기능 : 메모 열기 동작이 어느 노드를 대상으로 열렸는지 보여 주는 자리 표시 패널을 그린다. 메모 편집과 저장은 실험 대상이 아니라 읽기만 한다.
인자 : LabMemoPanelProps
반환값 : 메모 자리 표시 패널
*/
export function LabMemoPanel({ nodeLabel, memo, onClose }: LabMemoPanelProps) {
  return (
    <aside
      aria-label="메모"
      className="flex w-72 shrink-0 flex-col gap-3 border-l border-line bg-surface-muted p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-bold text-content">{nodeLabel}</h2>
        <button
          type="button"
          aria-label="메모 닫기"
          onClick={onClose}
          className="rounded-control p-1 text-content-secondary hover:bg-surface-hover"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <p className="text-sm whitespace-pre-wrap text-content-secondary">
        {memo ?? "메모가 없습니다."}
      </p>
      <p className="text-xs text-content-muted">
        실험실의 메모 패널은 대상 노드만 보여 줍니다. 편집은 제품 편집기에서
        합니다.
      </p>
    </aside>
  );
}
