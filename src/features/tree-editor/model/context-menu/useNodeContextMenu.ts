import {
  type MouseEvent,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import { useTreeStore } from "../treeStore";
import type { CustomEditorNode } from "../types";

export type NodeContextMenuState = {
  clientId: string; // 메뉴를 연 노드의 편집기 노드 ID
  x: number; // 캔버스 왼쪽 위를 기준으로 한 메뉴 위치
  y: number;
};

type UseNodeContextMenuParams = {
  containerRef: RefObject<HTMLElement | null>; // 메뉴 위치의 기준이 되는 캔버스 영역
  isDisabled: boolean; // 노드 추가·삭제 요청 중이면 메뉴를 열지 않는다.
};

/*
함수 이름 : useNodeContextMenu
기능 : 노드를 우클릭하면 그 노드를 선택하고 마우스 위치에 메뉴를 연다. 메뉴의 노드 추가·삭제·메모는
선택된 노드를 기준으로 동작하므로, 메뉴를 열기 전에 선택을 우클릭한 노드로 옮긴다.
인자 : UseNodeContextMenuParams
반환값 : 열린 메뉴 상태, React Flow의 onNodeContextMenu에 연결할 handler, 메뉴를 닫는 함수,
메뉴를 닫고 우클릭한 노드로 focus를 돌려주는 함수
*/
export function useNodeContextMenu({
  containerRef,
  isDisabled,
}: UseNodeContextMenuParams) {
  const [contextMenu, setContextMenu] = useState<NodeContextMenuState | null>(
    null,
  );
  const selectOnlyNodeInStore = useTreeStore(
    (state) => state.selectOnlyNodeInStore,
  );

  /*
  Escape로 닫으면 메뉴 항목에 있던 focus가 갈 곳을 잃으므로, 우클릭한 노드 요소를 기억해 두었다가 돌려준다.
  */
  const nodeElementRef = useRef<HTMLElement | null>(null);

  const handleNodeContextMenu = useCallback(
    (event: MouseEvent, node: CustomEditorNode) => {
      event.preventDefault(); // 브라우저 기본 메뉴 대신 노드 메뉴를 띄운다.

      const container = containerRef.current;
      if (isDisabled || !container) return;

      const rect = container.getBoundingClientRect();

      nodeElementRef.current =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".react-flow__node")
          : null;

      selectOnlyNodeInStore(node.id);
      setContextMenu({
        clientId: node.id,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    },
    [containerRef, isDisabled, selectOnlyNodeInStore],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const closeContextMenuAndFocusNode = useCallback(() => {
    setContextMenu(null);
    nodeElementRef.current?.focus();
  }, []);

  return {
    contextMenu,
    handleNodeContextMenu,
    closeContextMenu,
    closeContextMenuAndFocusNode,
  };
}
