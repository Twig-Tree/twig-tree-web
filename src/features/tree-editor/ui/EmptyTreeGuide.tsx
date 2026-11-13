import type { ReactNode } from "react";
import { Network, Plus } from "lucide-react";

type EmptyTreeGuideProps = {
  onAddRootNode: () => void; // 빈 트리에 루트 노드를 추가한다.
  isAddRootNodeDisabled: boolean; // 추가 요청 중이거나 다른 편집·AI 생성이 진행 중이면 true
  /*
  AI로 트리를 채우는 입력 영역. 프롬프트 입력은 다른 feature가 소유하므로 이 컴포넌트는 자리만 두고,
  무엇을 넣을지는 두 feature를 조합하는 호출부가 정한다. 넘기지 않으면 직접 추가만 보인다.
  */
  aiFillSlot?: ReactNode;
};

/*
함수 이름 : EmptyTreeGuide
기능 : 노드가 하나도 없는 트리에서 트리를 시작하는 방법을 안내한다. AI로 채우는 입력 자리와 루트 노드를 직접 추가하는 버튼을 보여준다.
인자 : EmptyTreeGuideProps
반환값 : 빈 트리 안내 영역

노드가 있으면 추가·삭제는 노드 우클릭 메뉴가 맡는다. 우클릭할 노드가 없는 빈 트리에서는 시작할 방법이 보이지 않아
캔버스 가운데에 진입점을 둔다. 위치는 호출부가 정한다.

안내 자체는 카드로 감싸지 않는다. 입력창이 이미 카드 모양이라, 감싸면 카드 안에 카드가 생겨 무거워지고
캔버스 위에 뜬 대화상자처럼 보인다. 대시보드처럼 제목과 입력창만 캔버스 위에 둔다.
*/
export function EmptyTreeGuide({
  onAddRootNode,
  isAddRootNodeDisabled,
  aiFillSlot,
}: EmptyTreeGuideProps) {
  return (
    <section
      aria-labelledby="empty-tree-guide-title"
      className="flex w-full flex-col items-center gap-6 text-center"
    >
      <header className="flex flex-col items-center gap-3">
        <div
          aria-hidden
          className="flex size-11 items-center justify-center rounded-card bg-accent-subtle text-accent"
        >
          <Network className="size-5" strokeWidth={2} />
        </div>

        <div>
          <h2
            id="empty-tree-guide-title"
            className="text-2xl font-semibold tracking-tight text-content"
          >
            아직 트리가 없어요
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-content-muted">
            {aiFillSlot
              ? "AI로 트리를 만들거나 노드를 직접 추가해 시작해 보세요."
              : "첫 노드를 추가해 트리를 시작해 보세요."}
          </p>
        </div>
      </header>

      {aiFillSlot ? (
        <div className="flex w-full flex-col gap-3 text-left">{aiFillSlot}</div>
      ) : null}

      <button
        type="button"
        onClick={onAddRootNode}
        disabled={isAddRootNodeDisabled}
        className={`flex h-9 items-center gap-1.5 rounded-control px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:pointer-events-none ${
          aiFillSlot
            ? "text-content-secondary hover:bg-surface-hover hover:text-content disabled:text-content-disabled"
            : "bg-accent text-on-accent hover:bg-accent-hover disabled:bg-accent-disabled"
        }`}
      >
        <Plus aria-hidden className="size-4" strokeWidth={2} />
        직접 노드 추가
      </button>
    </section>
  );
}
