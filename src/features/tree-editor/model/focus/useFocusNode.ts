import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { getAncestorClientIds } from "../../lib/getAncestorClientIds";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import { CustomEditorNode } from "../types";

const CENTER_NODE_DURATION_MS = 300; // 노드로 화면을 옮기는 애니메이션 시간

type UseFocusNodeParams = {
  visibleNodes: CustomEditorNode[]; // 화면에 보이는 노드 목록. 대상이 없으면 레이아웃이 끝난 뒤에 옮긴다
  runAfterNextLayout: (callback: () => void) => void; // 다음 레이아웃 결과를 얹은 뒤 실행할 함수를 맡기는 함수
  isLayoutRunning: () => boolean; // 레이아웃 계산이 진행 중인지. 진행 중이면 보이는 노드라도 결과를 기다린다
};

/*
함수 이름 : useFocusNode
기능 : 결과 목록에서 고른 노드의 접힌 조상을 펼치고, 그 노드를 선택해 현재 배율 그대로 화면 가운데로 옮기는 핸들러를 만든다.
인자 : UseFocusNodeParams
반환값 : 노드로 이동하는 핸들러
*/
export const useFocusNode = ({
  visibleNodes,
  runAfterNextLayout,
  isLayoutRunning,
}: UseFocusNodeParams) => {
  const { getInternalNode, getNodesBounds, getZoom, setCenter } =
    useReactFlow();
  const selectOnlyNodeInStore = useTreeStore(
    (state) => state.selectOnlyNodeInStore,
  );
  const expandAll = useCollapseStore((state) => state.expandAll);

  /*
  접힌 조상을 모두 펼친다. 접힘 상태는 serverId로 저장되므로 조상의 clientId를 serverId로 바꿔 넘기고,
  serverId가 없는 조상은 접혀 있을 수 없으므로 건너뛴다. 이미 펼쳐진 조상은 expandAll이 걸러 낸다.
  노드와 엣지는 렌더에 쓰지 않고 이 순간에만 필요하므로 구독하지 않고 store에서 바로 읽는다.
  */
  const expandAncestors = useCallback(
    (clientId: string) => {
      const { treeId, nodes, edges } = useTreeStore.getState();

      if (treeId === null) return;

      const ancestorClientIds = new Set(getAncestorClientIds(edges, clientId));
      const ancestorServerIds = nodes.flatMap((node) =>
        ancestorClientIds.has(node.id) && node.data.serverId !== null
          ? [node.data.serverId]
          : [],
      );

      expandAll(treeId, ancestorServerIds);
    },
    [expandAll],
  );

  /*
  React Flow가 새 좌표로 노드를 그린 뒤에 읽도록 다음 프레임으로 미루고, 렌더된 노드의 실제 상자 가운데로 옮긴다.
  setCenter는 zoom을 넘기지 않으면 maxZoom으로 확대하므로 현재 배율을 그대로 넘긴다.
  */
  const moveToNodeCenter = useCallback(
    (clientId: string) => {
      window.requestAnimationFrame(() => {
        if (!getInternalNode(clientId)) return; // 그 사이 삭제되었거나 여전히 숨겨져 있으면 옮기지 않는다.

        const { x, y, width, height } = getNodesBounds([clientId]);

        void setCenter(x + width / 2, y + height / 2, {
          zoom: getZoom(),
          duration: CENTER_NODE_DURATION_MS,
        });
      });
    },
    [getInternalNode, getNodesBounds, getZoom, setCenter],
  );

  /*
  선택은 메모 패널과 노드 추가·삭제의 기준이 되므로, 고른 노드 하나만 선택된 상태로 만든 뒤 화면을 옮긴다.
  보이지 않는 노드는 아직 좌표가 확정되지 않았으므로 레이아웃이 끝난 뒤에 옮긴다. 보이는 노드라도 레이아웃 계산 중이면
  결과를 얹을 때 움직일 수 있고, 앞서 미뤄 둔 이동이 이 이동을 덮을 수 있으므로 함께 기다린다.

  펼치기와 선택은 같은 렌더에 반영되어야 한다. 선택만 먼저 반영되면 대상이 아직 숨겨진 상태라
  useVisibleElements가 "선택된 노드가 숨겨졌다"고 보고 선택을 풀고 메모 패널을 닫는다.
  두 store 변경을 이 핸들러 안에서 동기로 하면 React가 한 번에 렌더한다.
  */
  const focusNode = useCallback(
    (clientId: string) => {
      expandAncestors(clientId);
      selectOnlyNodeInStore(clientId);

      const isVisible = visibleNodes.some((node) => node.id === clientId);

      if (isVisible && !isLayoutRunning()) {
        moveToNodeCenter(clientId);
        return;
      }

      runAfterNextLayout(() => moveToNodeCenter(clientId));
    },
    [
      visibleNodes,
      isLayoutRunning,
      expandAncestors,
      selectOnlyNodeInStore,
      moveToNodeCenter,
      runAfterNextLayout,
    ],
  );

  return { focusNode };
};
