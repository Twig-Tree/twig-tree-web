import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useLectureStore } from "../lecture/lectureStore";
import { useTreeStore } from "../treeStore";
import { useCameraPhaseStore } from "./cameraPhaseStore";
import { useCameraMove } from "./useCameraMove";
import { usePanelCameraAlignment } from "./usePanelCameraAlignment";

const setViewportMock = vi.fn();
let currentViewport = { x: 500, y: 400, zoom: 1 };
let canvasRect = {
  top: 0,
  left: 0,
  right: 1000,
  bottom: 800,
  width: 1000,
  height: 800,
};

const domNode = document.createElement("div");

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({
    getInternalNode: (id: string) =>
      useTreeStore.getState().nodes.find((node) => node.id === id),
    getViewport: () => currentViewport,
    getZoom: () => currentViewport.zoom,
    setViewport: (
      nextViewport: { x: number; y: number; zoom: number },
      options?: { duration?: number },
    ) => {
      currentViewport = nextViewport;
      setViewportMock(nextViewport, options);
      return Promise.resolve(true);
    },
  }),
  useStoreApi: () => ({
    getState: () => ({
      domNode,
      width: canvasRect.width,
      height: canvasRect.height,
      minZoom: 0.3,
      maxZoom: 2,
    }),
  }),
}));

describe("usePanelCameraAlignment", () => {
  beforeEach(() => {
    setViewportMock.mockReset();
    currentViewport = { x: 500, y: 400, zoom: 1 };
    canvasRect = {
      top: 0,
      left: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
    };
    vi.spyOn(domNode, "getBoundingClientRect").mockImplementation(
      () => canvasRect as DOMRect,
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    useCameraPhaseStore.getState().resetCameraPhase();
    useLectureStore.getState().resetLecture();
    useTreeStore.setState({
      treeId: "tree-1",
      nodes: [
        createEditorNode({
          clientId: "node-1",
          serverId: "1",
          label: "루트",
          orderIndex: 0,
          x: 0,
          y: 0,
        }),
      ],
      edges: [],
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("패널이 열려 시각 프레임이 줄어들면 기준 위상에 맞춰 축소·정렬하고, 다시 닫히면 원래 배율과 위치로 돌아간다", () => {
    const { rerender } = renderHook(
      ({ panelLayoutKey }) => usePanelCameraAlignment(panelLayoutKey),
      { initialProps: { panelLayoutKey: "open:false:false:false" } },
    );

    canvasRect = {
      ...canvasRect,
      right: 800,
      width: 800,
    };
    rerender({ panelLayoutKey: "open:false:true:false" });

    expect(setViewportMock).toHaveBeenLastCalledWith(
      { x: 400, y: 400, zoom: 0.8 },
      { duration: expect.any(Number) },
    );

    canvasRect = {
      ...canvasRect,
      right: 1000,
      width: 1000,
    };
    rerender({ panelLayoutKey: "open:false:false:false" });

    expect(setViewportMock).toHaveBeenLastCalledWith(
      { x: 500, y: 400, zoom: 1 },
      { duration: expect.any(Number) },
    );
  });

  it("글자 크기가 10px 아래로 줄어들어야 할 때는 축소를 멈추고 선택 노드가 새 시각 프레임의 여백 안에 들어오도록 최소 이동한다", () => {
    useTreeStore.setState({
      nodes: [
        {
          ...createEditorNode({
            clientId: "node-right",
            serverId: "1",
            label: "오른쪽 노드",
            orderIndex: 0,
            x: 300,
            y: -20,
          }),
          width: 150,
          height: 40,
          selected: true,
        },
      ],
    });

    const { rerender } = renderHook(
      ({ panelLayoutKey }) => usePanelCameraAlignment(panelLayoutKey),
      { initialProps: { panelLayoutKey: "open:true:false:false" } },
    );

    canvasRect = {
      ...canvasRect,
      right: 500,
      width: 500,
    };
    rerender({ panelLayoutKey: "open:true:true:false" });

    const [alignedViewport] = setViewportMock.mock.lastCall!;
    expect(alignedViewport.zoom).toBeCloseTo(10 / 13);
    expect(alignedViewport.x + 450 * alignedViewport.zoom).toBeCloseTo(
      500 - 24,
    );
  });

  it("패널이 열린 동안 사용자가 직접 화면을 옮기면 옮긴 위치를 새 기준 위상으로 삼는다", () => {
    const { result, rerender } = renderHook(
      ({ panelLayoutKey }) => usePanelCameraAlignment(panelLayoutKey),
      { initialProps: { panelLayoutKey: "open:false:false:false" } },
    );

    canvasRect = {
      ...canvasRect,
      right: 800,
      width: 800,
    };
    rerender({ panelLayoutKey: "open:false:true:false" });

    act(() => {
      result.current.handleUserMoveStart(new MouseEvent("mousedown"));
      currentViewport = { x: 200, y: 300, zoom: 0.9 };
    });

    canvasRect = {
      ...canvasRect,
      right: 1000,
      width: 1000,
    };
    rerender({ panelLayoutKey: "open:false:false:false" });

    expect(setViewportMock).toHaveBeenLastCalledWith(
      { x: 300, y: 300, zoom: 0.9 },
      { duration: expect.any(Number) },
    );
  });

  it("같은 프레임에서 노드 포커싱 이동이 실행되면 패널 정렬이 포커싱 이동을 덮어쓰지 않는다", () => {
    let rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });

    const { result, rerender } = renderHook(
      ({ panelLayoutKey }) => {
        const alignment = usePanelCameraAlignment(panelLayoutKey);
        const cameraMove = useCameraMove();
        return { ...alignment, ...cameraMove };
      },
      { initialProps: { panelLayoutKey: "open:false:false:false" } },
    );

    canvasRect = {
      ...canvasRect,
      right: 640,
      width: 640,
    };
    rerender({ panelLayoutKey: "open:false:true:false" });
    result.current.centerFinalNode("node-1");

    const queuedCallbacks = rafCallbacks;
    rafCallbacks = [];
    queuedCallbacks.forEach((callback) => callback(0));

    expect(setViewportMock).toHaveBeenCalledTimes(1);
  });

  it("강의 재생 중에는 편집기 패널 정렬로 카메라를 옮기지 않는다", () => {
    const { rerender } = renderHook(
      ({ panelLayoutKey }) => usePanelCameraAlignment(panelLayoutKey),
      { initialProps: { panelLayoutKey: "open:false:false:false" } },
    );

    act(() => {
      useLectureStore.getState().startLecture({
        id: "script",
        title: "강의",
        scenes: [{ id: "scene", clientId: "node-1", beats: [] }],
      });
    });

    canvasRect = {
      ...canvasRect,
      right: 640,
      width: 640,
    };
    rerender({ panelLayoutKey: "open:false:true:false" });

    expect(setViewportMock).not.toHaveBeenCalled();
  });
});
