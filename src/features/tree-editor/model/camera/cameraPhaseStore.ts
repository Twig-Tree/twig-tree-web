import { create } from "zustand";
import {
  type CameraReferencePhase,
  type CanvasFrame,
  type FlowViewport,
  getCameraReferencePhase,
} from "../../lib/getCameraFrame";

const VIEWPORT_EPSILON = 0.01;

const isSameViewport = (
  a: FlowViewport | null,
  b: FlowViewport | null,
): boolean => {
  if (!a || !b) return false;

  return (
    Math.abs(a.x - b.x) < VIEWPORT_EPSILON &&
    Math.abs(a.y - b.y) < VIEWPORT_EPSILON &&
    Math.abs(a.zoom - b.zoom) < VIEWPORT_EPSILON
  );
};

interface CameraPhaseState {
  referencePhase: CameraReferencePhase | null; // 패널이 열리고 닫혀도 유지할 기준 위상 정보
  lastFrame: CanvasFrame | null; // 직전 패널 배치에서 잰 시각 프레임
  lastTargetViewport: FlowViewport | null; // 코드가 마지막으로 맞춘 목표 화면 값
  programmaticMoveUntil: number; // 코드가 시작한 화면 이동 애니메이션이 끝나는 시각(ms)
  explicitMoveId: number; // 전체 맞춤·노드 포커싱처럼 기준 위상을 새로 잡는 카메라 이동의 순번

  syncCanvasFrame: (frame: CanvasFrame, viewport: FlowViewport) => void;
  recordExplicitCameraMove: (
    viewport: FlowViewport,
    frame: CanvasFrame,
    durationMs: number,
  ) => void;
  recordPanelAlignedMove: (
    viewport: FlowViewport,
    frame: CanvasFrame,
    durationMs: number,
  ) => void;
  recordUserViewportIfChanged: (viewport: FlowViewport) => void;
  markUserMoveStarted: () => void;
  resetCameraPhase: () => void;
}

/*
패널이 열리고 닫힐 때 카메라는 직전 화면이 아니라 사용자가 원래 보던 기준 위상(중심 흐름 좌표와 흐름 크기)을
새 시각 프레임에 맞춘다. 그래야 패널을 닫았을 때 열기 전의 배율과 위치로 정확히 돌아갈 수 있다.
useCameraMove를 부르는 여러 hook과 패널 정렬 hook이 같은 기준 위상을 공유하도록 store에 둔다.
*/
export const useCameraPhaseStore = create<CameraPhaseState>()((set, get) => ({
  referencePhase: null,
  lastFrame: null,
  lastTargetViewport: null,
  programmaticMoveUntil: 0,
  explicitMoveId: 0,

  syncCanvasFrame: (frame, viewport) => {
    const { referencePhase } = get();

    set({
      lastFrame: frame,
      ...(referencePhase === null
        ? {
            referencePhase: getCameraReferencePhase(viewport, frame),
            lastTargetViewport: viewport,
          }
        : {}),
    });
  },

  recordExplicitCameraMove: (viewport, frame, durationMs) => {
    set((state) => ({
      referencePhase: getCameraReferencePhase(viewport, frame),
      lastFrame: frame,
      lastTargetViewport: viewport,
      programmaticMoveUntil: Date.now() + durationMs,
      explicitMoveId: state.explicitMoveId + 1,
    }));
  },

  recordPanelAlignedMove: (viewport, frame, durationMs) => {
    set({
      lastFrame: frame,
      lastTargetViewport: viewport,
      programmaticMoveUntil: Date.now() + durationMs,
    });
  },

  recordUserViewportIfChanged: (viewport) => {
    const {
      referencePhase,
      lastFrame,
      lastTargetViewport,
      programmaticMoveUntil,
    } = get();

    if (lastFrame === null) return;

    /*
    패널 정렬이나 카메라 이동 애니메이션이 아직 진행 중일 때 패널을 연달아 여닫으면,
    중간 프레임을 사용자가 직접 옮긴 화면으로 오인하지 않도록 원래 기준 위상을 유지한다.
    */
    if (
      Date.now() < programmaticMoveUntil &&
      lastTargetViewport !== null &&
      referencePhase !== null
    ) {
      return;
    }

    if (
      referencePhase !== null &&
      isSameViewport(viewport, lastTargetViewport)
    ) {
      return;
    }

    const nextReference = getCameraReferencePhase(viewport, lastFrame);

    if (nextReference !== null) {
      set({
        referencePhase: nextReference,
        lastTargetViewport: viewport,
      });
    }
  },

  markUserMoveStarted: () => {
    set({
      lastTargetViewport: null,
      programmaticMoveUntil: 0,
    });
  },

  resetCameraPhase: () => {
    set({
      referencePhase: null,
      lastFrame: null,
      lastTargetViewport: null,
      programmaticMoveUntil: 0,
      explicitMoveId: 0,
    });
  },
}));
