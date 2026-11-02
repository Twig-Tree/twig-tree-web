import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabCanvasStyle,
  getWorkspaceLabNodeDensity,
  getWorkspaceLabNodeDensityStyle,
  getWorkspaceLabNodeSize,
  workspaceLabCanvasStyles,
  workspaceLabCollapseControlStyles,
  workspaceLabConnectionPointStyles,
  workspaceLabNodeDensities,
} from "./visual-slots";

const slotCollections = [
  workspaceLabConnectionPointStyles,
  workspaceLabCollapseControlStyles,
  workspaceLabCanvasStyles,
  workspaceLabNodeDensities,
];

describe("workspaceLab visual slots", () => {
  it("각 슬롯 안의 ID가 서로 겹치지 않는다", () => {
    for (const slots of slotCollections) {
      const ids = slots.map((slot) => slot.id);

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("CSS로 표현하는 캔버스는 React Flow 패턴을 사용하지 않는다", () => {
    for (const id of ["paper", "spotlight", "plain"] as const) {
      expect(getWorkspaceLabCanvasStyle(id).backgrounds).toBeUndefined();
    }
  });

  it("모눈의 주선이 보조선과 같은 좌표에 그어진다", () => {
    const [minor, major] =
      getWorkspaceLabCanvasStyle("graph").backgrounds ?? [];
    const getFirstLine = (gap: number) => gap / 2;

    expect(
      (getFirstLine(major.gap) - getFirstLine(minor.gap)) % minor.gap,
    ).toBe(0);
  });

  it("노드 밀도에 따라 원형 노드 직경이 커진다", () => {
    const compact = getWorkspaceLabNodeDensity("compact");
    const comfortable = getWorkspaceLabNodeDensity("comfortable");
    const spacious = getWorkspaceLabNodeDensity("spacious");

    expect(compact.circleSize).toBeLessThan(comfortable.circleSize);
    expect(comfortable.circleSize).toBeLessThan(spacious.circleSize);
  });

  it("노드 밀도를 CSS 치수 변수로 변환한다", () => {
    const density = getWorkspaceLabNodeDensity("comfortable");

    expect(getWorkspaceLabNodeDensityStyle(density)).toMatchObject({
      "--lab-node-padding-x": "16px",
      "--lab-node-min-width": "148px",
      "--lab-node-content-min-height": "48px",
      "--lab-node-label-font-size": "13px",
    });
  });

  it("밀도와 모양을 레이아웃이 사용할 노드 크기로 조합한다", () => {
    const density = getWorkspaceLabNodeDensity("comfortable");

    expect(getWorkspaceLabNodeSize(density, "rounded")).toEqual({
      width: 148,
      height: 76,
    });
    expect(getWorkspaceLabNodeSize(density, "circle")).toEqual({
      width: 112,
      height: 112,
    });
  });
});
