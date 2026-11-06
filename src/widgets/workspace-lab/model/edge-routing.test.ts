import { describe, expect, it } from "vitest";
import {
  workspaceLabSmoothStepMinimumGap,
  workspaceLabSmoothStepRouting,
} from "./edge-routing";

describe("workspaceLab smooth-step routing", () => {
  it("양쪽 직선 구간과 중앙 여유를 포함한 최소 간격을 제공한다", () => {
    expect(workspaceLabSmoothStepMinimumGap).toBe(
      workspaceLabSmoothStepRouting.offset * 2 +
        workspaceLabSmoothStepRouting.centerClearance,
    );
    expect(workspaceLabSmoothStepMinimumGap).toBe(48);
  });
});
