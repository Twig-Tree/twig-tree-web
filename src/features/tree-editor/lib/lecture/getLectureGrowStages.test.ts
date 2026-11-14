import { describe, expect, it } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { getLectureGrowStages } from "./getLectureGrowStages";

/*
root ─┬─ a ─ a1
      └─ b ─┬─ b1
            └─ b2
*/
const edges = [
  ["root", "a"],
  ["root", "b"],
  ["a", "a1"],
  ["b", "b1"],
  ["b", "b2"],
].map(([sourceClientId, targetClientId]) =>
  createEditorEdge({ sourceClientId, targetClientId }),
);

describe("getLectureGrowStages", () => {
  it("대상에서 떨어진 깊이별로 자손을 묶는다", () => {
    expect(getLectureGrowStages(["root"], edges)).toEqual([
      ["a", "b"],
      ["a1", "b1", "b2"],
    ]);
  });

  it("자손이 없으면 빈 목록을 돌려준다", () => {
    expect(getLectureGrowStages(["a1"], edges)).toEqual([]);
  });

  it("대상끼리 조상·자손 사이면 자손 쪽 대상은 숨기지 않는다", () => {
    expect(getLectureGrowStages(["root", "b"], edges)).toEqual([
      ["a", "b1", "b2"],
      ["a1"],
    ]);
  });
});
