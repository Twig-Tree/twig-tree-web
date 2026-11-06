import { type MouseEvent, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useCollapseStore } from "@/src/features/tree-editor/model/collapse/collapseStore";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";

type CollapseToggleButtonProps = {
  clientId: string; // 버튼을 붙일 노드의 편집기 노드 ID
  serverId: string | null; // 접힘 상태를 식별하는 노드의 serverId. 서버에 저장 전이면 null
};

/*
함수 이름 : CollapseToggleButton
기능 : 노드의 하위 트리를 접고 펼치는 버튼을 그린다. 자식이 있고 서버에 저장된 노드에만 보인다.
인자 : CollapseToggleButtonProps
반환값 : 토글 버튼. 그릴 수 없는 노드면 null
*/
export function CollapseToggleButton({
  clientId,
  serverId,
}: CollapseToggleButtonProps) {
  const treeId = useTreeStore((state) => state.treeId);

  /*
  셀렉터가 boolean을 돌려주므로, 다른 노드의 엣지가 바뀌어도 결과가 같으면 이 버튼은 다시 그려지지 않는다.
  */
  const hasChildren = useTreeStore((state) =>
    state.edges.some((edge) => edge.source === clientId),
  );
  const isCollapsed = useCollapseStore(
    (state) => serverId !== null && state.collapsedServerIds.has(serverId),
  );
  const toggleCollapse = useCollapseStore((state) => state.toggleCollapse);

  /*
  클릭이 노드까지 전파되면 React Flow가 노드를 선택하므로 여기서 막는다.
  */
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      if (treeId === null || serverId === null) return;

      toggleCollapse(treeId, serverId);
    },
    [serverId, toggleCollapse, treeId],
  );

  /*
  serverId가 없는 노드는 서버에 저장 전이라 자식을 가질 수 없고, 접힘 상태를 저장할 ID도 없다.
  */
  if (!hasChildren || serverId === null || treeId === null) return null;

  return (
    <button
      type="button"
      aria-label={isCollapsed ? "하위 노드 펼치기" : "하위 노드 접기"}
      aria-expanded={!isCollapsed}
      onClick={handleClick}
      className="custom-node__collapse nodrag nopan absolute -bottom-2 flex h-5 items-center justify-center border border-line bg-surface text-node-content-muted hover:border-accent hover:text-accent"
    >
      <ChevronDown
        aria-hidden
        className={`size-[11px] transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
      />
    </button>
  );
}
