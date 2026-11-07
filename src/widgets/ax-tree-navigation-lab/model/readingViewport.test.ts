import { describe, expect, it } from "vitest";
import { getReadingViewport } from "./readingViewport";

const input = {
  frameWidth: 1000,
  frameHeight: 700,
  minZoom: 0.78,
  maxZoom: 1,
  minRows: 4,
  minDepths: 3,
  focusPosition: { x: 232, y: 368 },
  focusTopology: { depth: 1, breadth: 4 },
  nodeWidth: 168,
  nodeHeight: 60,
  layerGap: 64,
  siblingGap: 32,
  insets: { top: 96, right: 56, bottom: 72, left: 56 },
};

describe("getReadingViewport", () => {
  it("포커스 노드의 왼쪽 위를 기준 inset에 고정한다", () => {
    const { viewport } = getReadingViewport(input);

    expect(viewport).toEqual({
      x: 56 - 232,
      y: 96 - 368,
      zoom: 1,
    });
  });

  it("최소 슬롯을 만족하는 범위에서 최대 배율을 사용한다", () => {
    const { capacity, topologyWindow } = getReadingViewport(input);

    expect(capacity).toMatchObject({
      rows: 6,
      depths: 4,
      zoom: 1,
      isMinimumSatisfied: true,
    });
    expect(capacity.trailingRight).toBeCloseTo(80);
    expect(capacity.trailingBottom).toBeCloseTo(84);
    expect(topologyWindow).toEqual({
      origin: { depth: 1, breadth: 4 },
      size: { depth: 4, breadth: 6 },
    });
  });

  it("100%에서 최소 슬롯이 들어오지 않으면 필요한 만큼만 축소한다", () => {
    const { capacity } = getReadingViewport({
      ...input,
      frameWidth: 700,
    });

    expect(capacity.zoom).toBeCloseTo(588 / 632);
    expect(capacity).toMatchObject({
      rows: 6,
      depths: 3,
      isMinimumSatisfied: true,
    });
  });

  it("최저 배율에서도 최소 슬롯이 들어오지 않으면 가독성 하한을 우선한다", () => {
    const { capacity } = getReadingViewport({
      ...input,
      frameWidth: 400,
      frameHeight: 400,
    });

    expect(capacity.zoom).toBe(0.78);
    expect(capacity.isMinimumSatisfied).toBe(false);
    expect(capacity.depths).toBeLessThan(input.minDepths);
  });
});
