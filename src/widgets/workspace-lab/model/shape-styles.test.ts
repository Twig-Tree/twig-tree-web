import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabShapeCssStyle,
  getWorkspaceLabShapeStyle,
  workspaceLabShapeStyles,
} from "./shape-styles";

describe("workspaceLabShapeStyles", () => {
  it("형태 ID가 서로 겹치지 않는다", () => {
    const ids = workspaceLabShapeStyles.map((shape) => shape.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(workspaceLabShapeStyles)(
    "$name의 그림자는 컬러 테마의 그림자 색만 쓴다",
    (shape) => {
      for (const [name, value] of Object.entries(shape.tokens)) {
        if (name === "nodeRadius" || value === "none") continue; // 그림자가 없으면 색도 없다

        expect(value).toContain("var(--lab-shadow-ink)");
        expect(value).not.toMatch(/rgb\(|#[0-9a-f]{3,6}/i);
      }
    },
  );

  it("형태 토큰을 CSS 변수로 변환한다", () => {
    expect(
      getWorkspaceLabShapeCssStyle(getWorkspaceLabShapeStyle("hard")),
    ).toMatchObject({
      "--lab-node-radius": "6px",
      "--lab-node-shadow":
        "3px 3px 0 color-mix(in srgb, var(--lab-shadow-ink) 88%, transparent)",
    });
  });
});
