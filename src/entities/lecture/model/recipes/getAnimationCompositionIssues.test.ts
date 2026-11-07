import { describe, expect, it } from "vitest";
import { type LectureAnimation } from "../types";
import { getAnimationCompositionIssues } from "./getAnimationCompositionIssues";

const focus = (nodeId: string): LectureAnimation => ({
  type: "focus",
  targetNodeIds: [nodeId],
  maxZoom: 1,
  durationMs: 700,
});

const highlight = (nodeId: string, persist = false): LectureAnimation => ({
  type: "highlight",
  targetNodeIds: [nodeId],
  style: "steady",
  durationMs: 1200,
  ...(persist ? { persist } : {}),
});

const collapse = (nodeId: string): LectureAnimation => ({
  type: "collapse",
  targetNodeIds: [nodeId],
  durationMs: 850,
});

const expand = (nodeId: string): LectureAnimation => ({
  type: "expand",
  targetNodeIds: [nodeId],
  durationMs: 850,
});

const sequence = (...children: LectureAnimation[]): LectureAnimation => ({
  type: "group",
  mode: "sequence",
  children,
});

const parallel = (...children: LectureAnimation[]): LectureAnimation => ({
  type: "group",
  mode: "parallel",
  children,
});

const getIssuePaths = (
  animation: LectureAnimation,
  allowLingeringPersist = false,
) =>
  getAnimationCompositionIssues(animation, { allowLingeringPersist }).map(
    ({ path }) => path,
  );

describe("getAnimationCompositionIssues", () => {
  it("순서대로 카메라를 옮기고 효과를 지우면 문제가 없다", () => {
    expect(
      getIssuePaths(
        sequence(focus("1"), highlight("1", true), focus("2"), {
          type: "reset",
          scope: "visual",
        }),
      ),
    ).toEqual([]);
  });

  it("병렬 묶음의 두 갈래가 카메라를 움직이면 그 묶음을 가리킨다", () => {
    expect(
      getIssuePaths(
        sequence(highlight("1"), parallel(focus("1"), sequence(focus("2")))),
      ),
    ).toEqual([["children", 1]]);
  });

  it("카메라를 움직이지 않는 reset은 카메라 이동으로 세지 않는다", () => {
    expect(
      getIssuePaths(parallel(focus("1"), { type: "reset", scope: "visual" })),
    ).toEqual([]);
  });

  it("카메라를 움직이는 reset은 focus와 함께 쓸 수 없다", () => {
    expect(
      getIssuePaths(parallel(focus("1"), { type: "reset", scope: "all" })),
    ).toEqual([[]]);
  });

  it("병렬 묶음의 다른 갈래가 같은 노드를 접고 펼치면 나중 동작을 가리킨다", () => {
    expect(getIssuePaths(parallel(collapse("2"), expand("2")))).toEqual([
      ["children", 1],
    ]);
  });

  it("같은 갈래 안에서 차례로 접고 펼치는 것은 문제가 없다", () => {
    expect(
      getIssuePaths(
        parallel(sequence(collapse("2"), expand("2")), expand("3")),
      ),
    ).toEqual([]);
  });

  it("reset 없이 끝까지 남는 persist 효과를 가리킨다", () => {
    expect(
      getIssuePaths(sequence(highlight("1", true), highlight("2"))),
    ).toEqual([["children", 0]]);
  });

  it("camera reset은 persist 효과를 지우지 않는다", () => {
    expect(
      getIssuePaths(
        sequence(highlight("1", true), { type: "reset", scope: "camera" }),
      ),
    ).toEqual([["children", 0]]);
  });

  it("끝까지 남는 persist를 허용하면 문제로 보지 않는다", () => {
    expect(getIssuePaths(highlight("1", true), true)).toEqual([]);
  });
});
