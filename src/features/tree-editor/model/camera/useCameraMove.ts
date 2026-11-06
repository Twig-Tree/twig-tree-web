import { useCallback } from "react";
import { useReactFlow, useStoreApi } from "@xyflow/react";
import {
  type CameraFrameInsets,
  getViewportCenteredInFrame,
  getViewportFittedInFrame,
  measureCameraFrameInsets,
} from "../../lib/getCameraFrame";
import { NODE_HEIGHT, NODE_WIDTH } from "../../lib/layout";
import { getMotionDuration } from "../../lib/motion";
import { useTreeStore } from "../treeStore";
import { CustomEditorNode } from "../types";

type FitFinalNodesOptions = {
  clientIds?: string[]; // 모을 노드 ID. 없으면 화면에 그려진 노드 전체
  maxZoom: number; // 최대 배율
  duration?: number; // 화면 이동 시간. 강의처럼 연출이 시간을 정할 때 넘기며, 없으면 공통 전환 시간을 쓴다
};

/*
함수 이름 : getFinalNodeRect
기능 : store의 최종 좌표로 노드 상자를 구한다.
인자 : CustomEditorNode node -> 상자를 구할 노드
반환값 : 노드 상자의 네 변
*/
const getFinalNodeRect = (node: CustomEditorNode) => {
  const width = node.measured?.width ?? node.width ?? NODE_WIDTH;
  const height = node.measured?.height ?? node.height ?? NODE_HEIGHT;

  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + width,
    bottom: node.position.y + height,
  };
};

/*
함수 이름 : useCameraMove
기능 : 화면을 노드의 최종 좌표 기준으로 옮기는 함수를 만든다. 노드 전환 중에는 React Flow가 아는 좌표가 움직이는 중간값이라,
fitView와 getNodesBounds로 재면 전환이 끝난 뒤의 모습과 다른 곳을 향한다. store에는 항상 최종 좌표가 있으므로 그것으로 잰다.
화면은 캔버스 전체가 아니라 패널과 플레이어에 가리지 않는 시각 프레임을 기준으로 맞춘다.
인자 : 없음
반환값 : 노드들을 한 화면에 모으는 함수와 노드 하나를 현재 배율 그대로 시각 프레임 가운데로 옮기는 함수
*/
export const useCameraMove = () => {
  const { getInternalNode, getZoom, setViewport } = useReactFlow();
  const reactFlowStore = useStoreApi();

  /*
  패널을 연 직후에는 React Flow가 아는 캔버스 크기가 아직 예전 값일 수 있으므로 실제 요소를 잰다.
  */
  const measureCanvasFrame = useCallback((): {
    width: number;
    height: number;
    insets: CameraFrameInsets;
  } => {
    const { domNode, width, height } = reactFlowStore.getState();

    if (!domNode) {
      return {
        width,
        height,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      };
    }

    const canvas = domNode.getBoundingClientRect();

    return {
      width: canvas.width,
      height: canvas.height,
      insets: measureCameraFrameInsets(canvas),
    };
  }, [reactFlowStore]);

  const fitFinalNodes = useCallback(
    ({ clientIds, maxZoom, duration }: FitFinalNodesOptions) => {
      const targetClientIds = clientIds && new Set(clientIds);

      /*
      숨겨진 노드도 store에 있으므로 React Flow에 그려진 노드만 남긴다.
      */
      const rects = useTreeStore
        .getState()
        .nodes.filter(
          (node) =>
            getInternalNode(node.id) &&
            (!targetClientIds || targetClientIds.has(node.id)),
        )
        .map(getFinalNodeRect);

      if (rects.length === 0) return;

      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      const { minZoom } = reactFlowStore.getState();

      void setViewport(
        getViewportFittedInFrame(
          { left, top, right, bottom },
          measureCanvasFrame(),
          { minZoom, maxZoom },
        ),
        { duration: duration ?? getMotionDuration() },
      );
    },
    [getInternalNode, measureCanvasFrame, reactFlowStore, setViewport],
  );

  const centerFinalNode = useCallback(
    (clientId: string) => {
      const node = useTreeStore
        .getState()
        .nodes.find(({ id }) => id === clientId);

      if (!node || !getInternalNode(clientId)) return; // 그 사이 삭제되었거나 여전히 숨겨져 있으면 옮기지 않는다.

      const { left, top, right, bottom } = getFinalNodeRect(node);

      void setViewport(
        getViewportCenteredInFrame(
          { x: (left + right) / 2, y: (top + bottom) / 2 },
          getZoom(),
          measureCanvasFrame(),
        ),
        { duration: getMotionDuration() },
      );
    },
    [getInternalNode, getZoom, measureCanvasFrame, setViewport],
  );

  return { fitFinalNodes, centerFinalNode };
};
