import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useTreeStore } from "../treeStore";
import { CustomEditorNode } from "../types";

const CENTER_NODE_DURATION_MS = 300; // 노드로 화면을 옮기는 애니메이션 시간

type UseFocusNodeParams = {
  visibleNodes: CustomEditorNode[]; // 화면에 보이는 노드 목록. 대상이 없으면 레이아웃이 끝난 뒤에 옮긴다
  runAfterNextLayout: (callback: () => void) => void; // 다음 레이아웃 결과를 얹은 뒤 실행할 함수를 맡기는 함수
};

/*
함수 이름 : useFocusNode
기능 : 결과 목록에서 고른 노드를 선택하고, 현재 배율 그대로 화면 가운데로 옮기는 핸들러를 만든다.
인자 : UseFocusNodeParams
반환값 : 노드로 이동하는 핸들러
*/
export const useFocusNode = ({
  visibleNodes,
  runAfterNextLayout,
}: UseFocusNodeParams) => {
  const { getInternalNode, getNodesBounds, getZoom, setCenter } =
    useReactFlow();
  const selectOnlyNodeInStore = useTreeStore(
    (state) => state.selectOnlyNodeInStore,
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
  보이지 않는 노드는 아직 좌표가 확정되지 않았으므로 레이아웃이 끝난 뒤에 옮긴다.
  */
  const focusNode = useCallback(
    (clientId: string) => {
      selectOnlyNodeInStore(clientId);

      if (visibleNodes.some((node) => node.id === clientId)) {
        moveToNodeCenter(clientId);
        return;
      }

      runAfterNextLayout(() => moveToNodeCenter(clientId));
    },
    [visibleNodes, selectOnlyNodeInStore, moveToNodeCenter, runAfterNextLayout],
  );

  return { focusNode };
};
