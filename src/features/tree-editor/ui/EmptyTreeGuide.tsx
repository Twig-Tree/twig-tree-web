import { Plus } from "lucide-react";

type EmptyTreeGuideProps = {
  onAddRootNode: () => void; // 빈 트리에 루트 노드를 추가한다.
  isAddRootNodeDisabled: boolean; // 추가 요청 중이거나 다른 편집이 진행 중이면 true
};

/*
함수 이름 : EmptyTreeGuide
기능 : 노드가 하나도 없는 트리에서 트리를 시작하는 방법을 안내하고, 루트 노드를 직접 추가하는 버튼을 보여준다.
인자 : EmptyTreeGuideProps
반환값 : 빈 트리 안내 영역

노드가 있으면 추가·삭제는 노드 우클릭 메뉴가 맡는다. 우클릭할 노드가 없는 빈 트리에서는 시작할 방법이 보이지 않아
캔버스 가운데에 진입점을 둔다. 위치는 호출부가 정한다.
*/
export function EmptyTreeGuide({
  onAddRootNode,
  isAddRootNodeDisabled,
}: EmptyTreeGuideProps) {
  return (
    <section
      aria-labelledby="empty-tree-guide-title"
      className="flex w-full max-w-sm flex-col items-center gap-4 rounded-card border border-line bg-surface px-6 py-8 text-center shadow-control"
    >
      <div>
        <h2
          id="empty-tree-guide-title"
          className="text-base font-semibold text-content"
        >
          아직 트리가 없어요
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          첫 노드를 추가해 트리를 시작해 보세요.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddRootNode}
        disabled={isAddRootNodeDisabled}
        className="flex h-9 items-center gap-1.5 rounded-control bg-accent px-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:pointer-events-none disabled:bg-accent-disabled"
      >
        <Plus aria-hidden className="size-4" strokeWidth={2} />
        직접 노드 추가
      </button>
    </section>
  );
}
