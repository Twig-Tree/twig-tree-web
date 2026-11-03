import { useCallback, useMemo, useRef } from "react";
import { type OnNodeDrag, type XYPosition, useReactFlow } from "@xyflow/react";
import { getDropTarget } from "../../lib/move-node/getDropTarget";
import { MoveNodeParams } from "../../lib/move-node/getMovedElements";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import { CustomEditorEdge, CustomEditorNode } from "../types";

type UseMoveNodeByDragParams = {
  treeId: string | null; // 편집 중인 트리 ID. 트리가 없는 워크스페이스는 null
  visibleNodes: CustomEditorNode[]; // 화면에 보이는 노드 목록. 놓을 대상 후보다
  visibleEdges: CustomEditorEdge[]; // 화면에 보이는 엣지 목록. 끌 수 없는 루트를 가린다
  moveNode: (params: MoveNodeParams) => void; // 목적지가 정해지면 부를 노드 이동 함수
};

type DragStart = {
  clientId: string; // 끄는 노드의 편집기 노드 ID
  position: XYPosition; // 끌기 시작한 좌표. 놓을 수 없는 곳이면 여기로 되돌린다
};

/*
함수 이름 : getClientPoint
기능 : 마우스와 터치 이벤트에서 화면 좌표를 꺼낸다.
인자 : MouseEvent | TouchEvent event -> React Flow가 넘긴 드래그 이벤트
반환값 : 화면 좌표. 꺼낼 수 없으면 null
*/
const getClientPoint = (event: MouseEvent | TouchEvent) => {
  if ("changedTouches" in event) {
    const touch = event.changedTouches[0];

    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  return { x: event.clientX, y: event.clientY };
};

/*
함수 이름 : useMoveNodeByDrag
기능 : 노드 드래그를 노드 이동으로 바꾼다. 놓은 지점에서 목적지를 정해 노드 이동을 요청하고, 노드는 끌기 전 좌표로 되돌린다.
이동이 반영되면 구조가 바뀌어 레이아웃이 노드를 새 자리에 놓는다. 놓을 수 없는 곳이면 되돌린 좌표에 그대로 남는다.
인자 : UseMoveNodeByDragParams
반환값 : 루트를 끌 수 없게 표시한 노드 목록, React Flow 드래그 시작·끝 콜백
*/
export const useMoveNodeByDrag = ({
  treeId,
  visibleNodes,
  visibleEdges,
  moveNode,
}: UseMoveNodeByDragParams) => {
  const { screenToFlowPosition } = useReactFlow();
  const expand = useCollapseStore((state) => state.expand);
  const dragStartRef = useRef<DragStart | null>(null);

  /*
  루트는 형제가 없어 옮길 자리가 없으므로 끌지 못하게 한다. 루트만 새 객체가 되어 나머지 노드는 다시 그려지지 않는다.
  */
  const draggableNodes = useMemo(() => {
    const childClientIds = new Set(visibleEdges.map((edge) => edge.target));

    return visibleNodes.map((node) =>
      childClientIds.has(node.id) ? node : { ...node, draggable: false },
    );
  }, [visibleNodes, visibleEdges]);

  const onNodeDragStart: OnNodeDrag<CustomEditorNode> = useCallback(
    (_event, node) => {
      dragStartRef.current = { clientId: node.id, position: node.position };
    },
    [],
  );

  const onNodeDragStop: OnNodeDrag<CustomEditorNode> = useCallback(
    (event, node) => {
      const dragStart = dragStartRef.current;
      dragStartRef.current = null;

      if (!dragStart || dragStart.clientId !== node.id) return;

      /*
      끈 좌표는 저장하지 않는다. 먼저 끌기 전 좌표로 되돌리고, 이동이 반영되면 레이아웃이 새 자리로 옮긴다.
      좌표만 바꾸는 변경은 history 기록 조건에 걸리지 않으므로, 이동이 실패해 undo해도 이 좌표가 남는다.
      */
      useTreeStore.setState((state) => ({
        nodes: state.nodes.map((currentNode) =>
          currentNode.id === node.id
            ? { ...currentNode, position: dragStart.position }
            : currentNode,
        ),
      }));

      /*
      타입은 React 마우스 이벤트지만, React Flow는 d3-drag가 받은 브라우저 이벤트(마우스 또는 터치)를 그대로 넘긴다.
      */
      const clientPoint = getClientPoint(
        event as unknown as MouseEvent | TouchEvent,
      );
      if (treeId === null || !clientPoint) return;

      const { nodes, edges } = useTreeStore.getState();
      const dropTarget = getDropTarget({
        draggedClientId: node.id,
        point: screenToFlowPosition(clientPoint),
        visibleNodes,
        nodes,
        edges,
      });

      if (!dropTarget) return;

      /*
      접힌 노드의 자식으로 옮기면 옮긴 노드가 숨겨져, 선택이 풀리고 메모 패널이 닫힌다. 이동과 같은 handler 안에서 먼저 펼친다.
      이동이 실패해도 펼친 상태는 둔다. 접힘은 undo 대상이 아니다.
      */
      const anchorServerId = nodes.find(
        (currentNode) => currentNode.id === dropTarget.anchorClientId,
      )?.data.serverId;

      if (dropTarget.kind === "child" && anchorServerId) {
        expand(treeId, anchorServerId);
      }

      moveNode({
        clientId: dropTarget.clientId,
        parentClientId: dropTarget.parentClientId,
        position: dropTarget.position,
      });
    },
    [treeId, visibleNodes, moveNode, screenToFlowPosition, expand],
  );

  return { draggableNodes, onNodeDragStart, onNodeDragStop };
};
