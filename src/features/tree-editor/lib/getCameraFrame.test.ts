import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCameraFrameInsets,
  getViewportCenteredInFrame,
  getViewportFittedInFrame,
  measureCameraFrameInsets,
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
