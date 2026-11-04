import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabEdgeColor,
  getMatchingWorkspaceLabEdgeStylePresetId,
  getWorkspaceLabEdgeOpacity,
  getWorkspaceLabEdgePattern,
  getWorkspaceLabEdgeThickness,
  workspaceLabEdgeColors,
  workspaceLabEdgeEffects,
  workspaceLabEdgeMarkers,
  workspaceLabEdgeLineStyles,
  workspaceLabEdgeOpacities,
  workspaceLabEdgePatterns,
  workspaceLabEdgeStylePresets,
  workspaceLabEdgeThicknesses,
} from "./edge-styles";

const edgeSlotCollections = [
  workspaceLabEdgeLineStyles,
  workspaceLabEdgePatterns,
  workspaceLabEdgeThicknesses,
  workspaceLabEdgeColors,
  workspaceLabEdgeOpacities,
  workspaceLabEdgeEffects,
  workspaceLabEdgeMarkers,
  workspaceLabEdgeStylePresets,
];

describe("workspaceLab edge styles", () => {
  it("각 연결선 슬롯 안의 ID가 서로 겹치지 않는다", () => {
    for (const slots of edgeSlotCollections) {
      const ids = slots.map((slot) => slot.id);

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("기본 조합은 기존 정밀선과 같은 값을 사용한다", () => {
    expect(getWorkspaceLabEdgePattern("solid").dashArray).toBeUndefined();
    expect(getWorkspaceLabEdgeThickness("regular").width).toBe(1.5);
    expect(getWorkspaceLabEdgeColor("theme").value).toBe("var(--lab-edge)");
    expect(getWorkspaceLabEdgeOpacity("full").value).toBe(1);
  });

  it("원자 속성 조합과 일치하는 제안 preset을 찾는다", () => {
    expect(
      getMatchingWorkspaceLabEdgeStylePresetId(
        workspaceLabEdgeStylePresets[2].values,
      ),
    ).toBe("blueprint");

    expect(
      getMatchingWorkspaceLabEdgeStylePresetId({
        ...workspaceLabEdgeStylePresets[0].values,
        opacity: "faint",
      }),
    ).toBe("custom");
  });

  it("끝 모양은 '없음'만 경로가 비어 있고, 선 끝은 10×10 좌표계 안에 닿는다", () => {
    for (const marker of workspaceLabEdgeMarkers) {
      expect(marker.d === "").toBe(marker.id === "none");
      expect(marker.refX).toBeGreaterThan(0);
      expect(marker.refX).toBeLessThanOrEqual(10);
    }
  });
});
