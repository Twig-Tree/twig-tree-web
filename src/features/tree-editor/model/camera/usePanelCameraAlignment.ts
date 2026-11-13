import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import { useReactFlow, useStoreApi } from "@xyflow/react";
import {
  getViewportPreservingFramePhase,
  measureNodeBaseFontSize,
} from "../../lib/getCameraFrame";
import { getMotionDuration } from "../../lib/motion";
import { useLectureStore } from "../lecture/lectureStore";
import { useTreeStore } from "../treeStore";
import { useCameraPhaseStore } from "./cameraPhaseStore";
import { getFinalNodeRect, useCameraMove } from "./useCameraMove";

/*
함수 이름 : usePanelCameraAlignment
기능 : 검색·태그 패널, 메모 패널, 강의 만들기 패널이 열리고 닫히거나 반응형 배치가 바뀔 때,
원래 보던 시각 프레임의 기준 위상(중심과 흐름 크기)을 새 시각 프레임에 맞춰 카메라를 부드럽게 옮긴다.
강의 재생 중에는 useLectureCameraRefit이 설명 중인 노드로 다시 맞추므로 여기서는 움직이지 않는다.
인자 : string panelLayoutKey -> 패널 배치를 나타내는 값
반환값 : 사용자가 직접 화면 이동을 시작했을 때 호출할 핸들러
*/
export const usePanelCameraAlignment = (panelLayoutKey: string) => {
  const { getInternalNode, getViewport, setViewport } = useReactFlow();
  const reactFlowStore = useStoreApi();
  const { measureCanvasFrame } = useCameraMove();
  const previousPanelLayoutKeyRef = useRef(panelLayoutKey);

  const syncInitialFrame = useEffectEvent(() => {
    useCameraPhaseStore
      .getState()
      .syncCanvasFrame(measureCanvasFrame(), getViewport());
  });

  const alignCameraToNextFrame = useEffectEvent(() => {
    const phaseStore = useCameraPhaseStore.getState();
    const moveIdAtChange = phaseStore.explicitMoveId;

    /*
    패널이 바뀌기 직전에 사용자가 캔버스를 직접 끌거나 확대·축소했다면,
    바뀌기 전의 시각 프레임(lastFrame)과 지금 viewport로 기준 위상을 먼저 갱신한다.
    */
    phaseStore.recordUserViewportIfChanged(getViewport());

    const frameId = window.requestAnimationFrame(() => {
      const currentPhaseStore = useCameraPhaseStore.getState();

      /*
      검색 결과에서 메모가 일치한 노드를 눌러 포커싱과 메모 패널 열기가 함께 일어난 경우에는
      포커싱 쪽의 카메라 이동이 이미 새 프레임을 기준으로 실행되므로 덮어쓰지 않는다.
      */
      if (currentPhaseStore.explicitMoveId !== moveIdAtChange) return;

      const nextFrame = measureCanvasFrame();
      const lectureStatus = useLectureStore.getState().status;
      const isLectureActive =
        lectureStatus === "playing" || lectureStatus === "paused";
      const { nodes } = useTreeStore.getState();

      if (isLectureActive || nodes.length === 0) {
        currentPhaseStore.syncCanvasFrame(nextFrame, getViewport());
        return;
      }

      const { referencePhase } = currentPhaseStore;

      if (referencePhase === null) {
        currentPhaseStore.syncCanvasFrame(nextFrame, getViewport());
        return;
      }

      const selectedNodes = nodes.filter(
        (node) => node.selected && getInternalNode(node.id),
      );
      const selectedNodeBounds =
        selectedNodes.length === 1 ? getFinalNodeRect(selectedNodes[0]) : null;
      const { domNode, minZoom, maxZoom } = reactFlowStore.getState();
      const nextViewport = getViewportPreservingFramePhase(
        referencePhase,
        nextFrame,
        {
          minZoom,
          maxZoom,
          nodeBaseFontSizePx: measureNodeBaseFontSize(domNode),
          selectedNodeBounds,
        },
      );
      const moveDuration = getMotionDuration();

      currentPhaseStore.recordPanelAlignedMove(
        nextViewport,
        nextFrame,
        moveDuration,
      );

      void setViewport(nextViewport, { duration: moveDuration });
    });

    return () => window.cancelAnimationFrame(frameId);
  });

  useEffect(() => {
    syncInitialFrame();

    return () => {
      useCameraPhaseStore.getState().resetCameraPhase();
    };
  }, []);

  useEffect(() => {
    if (previousPanelLayoutKeyRef.current === panelLayoutKey) return;

    previousPanelLayoutKeyRef.current = panelLayoutKey;

    return alignCameraToNextFrame();
  }, [panelLayoutKey]);

  const handleUserMoveStart = useCallback(
    (event: MouseEvent | TouchEvent | null) => {
      if (event !== null) {
        useCameraPhaseStore.getState().markUserMoveStarted();
      }
    },
    [],
  );

  return { handleUserMoveStart };
};
