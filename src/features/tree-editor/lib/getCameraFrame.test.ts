import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCameraFrameInsets,
  getCameraReferencePhase,
  getViewportCenteredInFrame,
  getViewportFittedInFrame,
  getViewportPreservingFramePhase,
  measureCameraFrameInsets,
  measureNodeBaseFontSize,
} from "./getCameraFrame";

const canvas = { top: 100, right: 1200, bottom: 900, left: 200 };
const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

describe("getCameraFrameInsets", () => {
  it("캔버스와 나란히 놓인 패널은 가리지 않는다", () => {
    expect(
      getCameraFrameInsets(canvas, [
        {
          side: "left",
          rect: { top: 100, right: 200, bottom: 900, left: 0 },
        },
      ]),
    ).toEqual(NO_INSETS);
  });

  it("겹쳐 뜬 패널과 플레이어는 겹친 만큼 뺀다", () => {
    expect(
      getCameraFrameInsets(canvas, [
        {
          side: "left",
          rect: { top: 100, right: 456, bottom: 900, left: 200 },
        },
        {
          side: "bottom",
          rect: { top: 740, right: 1000, bottom: 884, left: 500 },
        },
      ]),
    ).toEqual({ ...NO_INSETS, left: 256, bottom: 160 });
  });

  it("숨겨져 크기가 없는 UI는 뺀다", () => {
    expect(
      getCameraFrameInsets(canvas, [
        { side: "right", rect: { top: 0, right: 0, bottom: 0, left: 0 } },
      ]),
    ).toEqual(NO_INSETS);
  });

  it("같은 쪽을 가리는 UI가 여럿이면 가장 깊은 값을 쓴다", () => {
    expect(
      getCameraFrameInsets(canvas, [
        { side: "top", rect: { top: 110, right: 400, bottom: 150, left: 300 } },
        { side: "top", rect: { top: 110, right: 900, bottom: 180, left: 800 } },
      ]).top,
    ).toBe(80);
  });

  it("노드가 들어갈 만큼 남으면 패널이 거의 덮어도 가림을 유지한다", () => {
    expect(
      getCameraFrameInsets({ top: 0, right: 500, bottom: 800, left: 0 }, [
        { side: "right", rect: { top: 0, right: 500, bottom: 800, left: 140 } },
      ]),
    ).toEqual({ ...NO_INSETS, right: 360 });
  });

  it("높이는 노드와 여백이 들어가는 70px까지 가림을 유지한다", () => {
    const canvas = { top: 0, right: 800, bottom: 400, left: 0 };
    const getInsets = (playerTop: number) =>
      getCameraFrameInsets(canvas, [
        {
          side: "bottom",
          rect: { top: playerTop, right: 800, bottom: 400, left: 0 },
        },
      ]);

    expect(getInsets(70)).toEqual({ ...NO_INSETS, bottom: 330 });
    expect(getInsets(69)).toEqual(NO_INSETS);
  });

  it("보이는 영역이 너무 좁게 남으면 그 방향의 가림을 무시한다", () => {
    const narrowCanvas = { top: 0, right: 500, bottom: 800, left: 0 };

    expect(
      getCameraFrameInsets(narrowCanvas, [
        { side: "left", rect: { top: 0, right: 256, bottom: 800, left: 0 } },
        { side: "right", rect: { top: 0, right: 500, bottom: 800, left: 140 } },
        {
          side: "bottom",
          rect: { top: 700, right: 400, bottom: 780, left: 100 },
        },
      ]),
    ).toEqual({ ...NO_INSETS, bottom: 100 });
  });
});

describe("measureCameraFrameInsets", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("표시된 요소의 쪽과 크기를 읽는다", () => {
    document.body.innerHTML = `
      <div data-camera-inset="bottom"></div>
      <div data-camera-inset="elsewhere"></div>
      <div></div>
    `;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 800,
      right: 1000,
      bottom: 880,
      left: 500,
    } as DOMRect);

    expect(measureCameraFrameInsets(canvas)).toEqual({
      ...NO_INSETS,
      bottom: 100,
    });
  });
});

describe("getViewportCenteredInFrame", () => {
  it("가려진 쪽을 뺀 영역의 가운데에 점을 둔다", () => {
    expect(
      getViewportCenteredInFrame({ x: 100, y: 50 }, 2, {
        width: 1000,
        height: 800,
        insets: { ...NO_INSETS, left: 200, bottom: 100 },
      }),
    ).toEqual({ x: 400, y: 250, zoom: 2 });
  });
});

describe("getViewportFittedInFrame", () => {
  const frame = {
    width: 1000,
    height: 800,
    insets: { ...NO_INSETS, left: 200, bottom: 100 },
  };
  const zoomRange = { minZoom: 0.1, maxZoom: 1 };

  it("여유가 있으면 배율 상한을 지키고 프레임 가운데에 둔다", () => {
    expect(
      getViewportFittedInFrame(
        { top: 0, right: 100, bottom: 100, left: 0 },
        frame,
        zoomRange,
      ),
    ).toEqual({ x: 550, y: 300, zoom: 1 });
  });

  it("상자가 크면 여백을 뺀 프레임에 들어가는 배율로 줄인다", () => {
    const { zoom } = getViewportFittedInFrame(
      { top: 0, right: 752, bottom: 100, left: 0 },
      frame,
      zoomRange,
    );

    expect(zoom).toBeCloseTo(1);

    expect(
      getViewportFittedInFrame(
        { top: 0, right: 1504, bottom: 100, left: 0 },
        frame,
        zoomRange,
      ).zoom,
    ).toBeCloseTo(0.5);
  });

  it("배율 하한 아래로 줄이지 않는다", () => {
    expect(
      getViewportFittedInFrame(
        { top: 0, right: 100000, bottom: 100, left: 0 },
        frame,
        zoomRange,
      ).zoom,
    ).toBe(0.1);
  });
});

describe("measureNodeBaseFontSize", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--theme-node-font-size");
  });

  it("테마 CSS 변수에서 노드 기본 글자 크기를 읽고 없으면 13px을 돌려준다", () => {
    expect(measureNodeBaseFontSize()).toBe(13);

    document.documentElement.style.setProperty(
      "--theme-node-font-size",
      "14px",
    );
    expect(measureNodeBaseFontSize()).toBe(14);
  });
});

describe("getCameraReferencePhase", () => {
  it("시각 프레임 중심의 흐름 좌표와 프레임에 들어오던 흐름 크기를 구한다", () => {
    expect(
      getCameraReferencePhase(
        { x: 400, y: 250, zoom: 2 },
        {
          width: 1000,
          height: 800,
          insets: { ...NO_INSETS, left: 200, bottom: 100 },
        },
      ),
    ).toEqual({
      center: { x: 100, y: 50 },
      flowWidth: 400,
      flowHeight: 350,
      zoom: 2,
    });
  });
});

describe("getViewportPreservingFramePhase", () => {
  const zoomRange = { minZoom: 0.3, maxZoom: 2 };
  const baseFrame = {
    width: 1000,
    height: 800,
    insets: NO_INSETS,
  };
  const reference = getCameraReferencePhase(
    { x: 500, y: 400, zoom: 1 },
    baseFrame,
  )!;

  it("더 많이 줄어든 축의 비율로 배율을 줄여 원래 보던 영역을 100% 담고, 프레임이 복구되면 원래 배율로 돌아간다", () => {
    const shrunkFrame = {
      width: 800,
      height: 800,
      insets: NO_INSETS,
    };

    const shrunkViewport = getViewportPreservingFramePhase(
      reference,
      shrunkFrame,
      {
        ...zoomRange,
        nodeBaseFontSizePx: 13,
        minReadableFontSizePx: 10,
      },
    );

    expect(shrunkViewport).toEqual({
      x: 400,
      y: 400,
      zoom: 0.8,
    });

    const restoredViewport = getViewportPreservingFramePhase(
      reference,
      baseFrame,
      {
        ...zoomRange,
        nodeBaseFontSizePx: 13,
        minReadableFontSizePx: 10,
      },
    );

    expect(restoredViewport).toEqual({
      x: 500,
      y: 400,
      zoom: 1,
    });
  });

  it("글자 크기가 10px 아래로 내려가야 하는 축소는 멈추고, 선택 노드가 새 시각 프레임의 여백 안에 들어오도록 최소 이동한다", () => {
    const narrowFrame = {
      width: 1000,
      height: 800,
      insets: { ...NO_INSETS, right: 500 },
    };
    const rightSideNodeBounds = {
      left: 300,
      top: -20,
      right: 450,
      bottom: 20,
    };

    const viewport = getViewportPreservingFramePhase(reference, narrowFrame, {
      ...zoomRange,
      nodeBaseFontSizePx: 13,
      minReadableFontSizePx: 10,
      selectedNodeBounds: rightSideNodeBounds,
    });

    expect(viewport.zoom).toBeCloseTo(10 / 13);
    expect(viewport.x + rightSideNodeBounds.right * viewport.zoom).toBeCloseTo(
      narrowFrame.width - narrowFrame.insets.right - 24,
    );
    expect(viewport.y).toBeCloseTo(400);
  });

  it("임계치에 걸려도 선택 노드가 이미 새 시각 프레임의 여백 안에 있으면 중심을 그대로 둔다", () => {
    const narrowFrame = {
      width: 1000,
      height: 800,
      insets: { ...NO_INSETS, right: 500 },
    };
    const centeredNodeBounds = {
      left: -50,
      top: -20,
      right: 50,
      bottom: 20,
    };

    const viewport = getViewportPreservingFramePhase(reference, narrowFrame, {
      ...zoomRange,
      nodeBaseFontSizePx: 13,
      minReadableFontSizePx: 10,
      selectedNodeBounds: centeredNodeBounds,
    });

    expect(viewport.zoom).toBeCloseTo(10 / 13);
    expect(viewport.x).toBeCloseTo(250);
    expect(viewport.y).toBeCloseTo(400);
  });

  it("원래부터 임계 글자 크기보다 작게 축소해 보고 있었다면 패널을 열 때 확대하지 않고 원래 배율을 유지한다", () => {
    const zoomedOutReference = getCameraReferencePhase(
      { x: 500, y: 400, zoom: 0.5 },
      baseFrame,
    )!;
    const narrowFrame = {
      width: 1000,
      height: 800,
      insets: { ...NO_INSETS, right: 400 },
    };

    const viewport = getViewportPreservingFramePhase(
      zoomedOutReference,
      narrowFrame,
      {
        ...zoomRange,
        nodeBaseFontSizePx: 13,
        minReadableFontSizePx: 10,
      },
    );

    expect(viewport.zoom).toBe(0.5);
    expect(viewport.x).toBe(300);
  });
});
