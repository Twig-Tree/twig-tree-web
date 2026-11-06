import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabNodeShape,
  workspaceLabNodeShapes,
} from "./node-shapes";

describe("workspaceLabNodeShapes", () => {
  it("노드 모양 ID가 서로 겹치지 않는다", () => {
    const ids = workspaceLabNodeShapes.map((shape) => shape.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("둥근 사각형을 기본 노드 모양으로 사용한다", () => {
    expect(getWorkspaceLabNodeShape("rounded").name).toBe("둥근 사각형");
  });

  it("원형 노드 정의를 조회한다", () => {
    const circle = getWorkspaceLabNodeShape("circle");

    expect(circle.name).toBe("원형");
  });
});
