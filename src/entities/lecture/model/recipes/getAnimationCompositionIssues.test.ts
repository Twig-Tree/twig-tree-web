import { describe, expect, it } from "vitest";
import { type LectureAnimation } from "../types";
import {
  getAnimationCompositionIssues,
  getAnimationDurationMs,
} from "./getAnimationCompositionIssues";

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

describe("getAnimationCompositionIssues의 실행 시각", () => {
  const wait = (durationMs: number): LectureAnimation => ({
    type: "wait",
    durationMs,
  });
  const reset: LectureAnimation = { type: "reset", scope: "visual" };

  it("병렬 갈래에서 먼저 실행된 reset은 나중에 시작한 persist를 지우지 않는다", () => {
    expect(
      getIssuePaths(parallel(sequence(wait(500), highlight("1", true)), reset)),
    ).toEqual([["children", 0, "children", 1]]);
  });

  it("병렬 갈래에서 나중에 실행된 reset은 먼저 시작한 persist를 지운다", () => {
    expect(
      getIssuePaths(parallel(highlight("1", true), sequence(wait(500), reset))),
    ).toEqual([]);
  });

  it("같은 시각이면 적힌 순서대로 적용한다", () => {
    expect(getIssuePaths(parallel(highlight("1", true), reset))).toEqual([]);
    expect(getIssuePaths(parallel(reset, highlight("1", true)))).toEqual([
      ["children", 1],
    ]);
  });
});

describe("getAnimationCompositionIssues의 persist 흐림 충돌", () => {
  const persistDim = (...exceptNodeIds: string[]): LectureAnimation => ({
    type: "dim",
    exceptNodeIds,
    durationMs: 1200,
    persist: true,
  });

  it("다른 노드를 남기는 persist 흐림이 함께 남으면 나중 흐림을 가리킨다", () => {
    expect(
      getIssuePaths(sequence(persistDim("1"), persistDim("2")), true),
    ).toEqual([["children", 1]]);
  });

  it("같은 노드를 남기는 persist 흐림은 겹쳐도 된다", () => {
    expect(
      getIssuePaths(sequence(persistDim("1", "2"), persistDim("2", "1")), true),
    ).toEqual([]);
  });

  it("reset 뒤의 흐림은 앞의 흐림과 겹치지 않는다", () => {
    expect(
      getIssuePaths(
        sequence(
          persistDim("1"),
          { type: "reset", scope: "visual" },
          persistDim("2"),
        ),
        true,
      ),
    ).toEqual([]);
  });
});

describe("getAnimationDurationMs", () => {
  const trace = (
    mode: "simultaneous" | "progressive",
    persist: boolean,
  ): LectureAnimation => ({
    type: "trace",
    nodeIds: ["1", "2"],
    durationMs: 900,
    mode,
    persist,
  });

  it("persist 효과는 기다리지 않으므로 0으로 센다", () => {
    expect(getAnimationDurationMs(highlight("1", true))).toBe(0);
    expect(getAnimationDurationMs(highlight("1"))).toBe(1200);
    expect(getAnimationDurationMs(trace("simultaneous", true))).toBe(0);
  });

  it("progressive trace는 persist여도 경로를 다 그릴 때까지 기다린다", () => {
    expect(getAnimationDurationMs(trace("progressive", true))).toBe(900);
  });

  it("순차 그룹은 더하고 병렬 그룹은 가장 긴 자식을 기다린다", () => {
    expect(
      getAnimationDurationMs({
        type: "group",
        mode: "sequence",
        children: [
          focus("1"),
          highlight("1", true),
          {
            type: "group",
            mode: "parallel",
            children: [highlight("2"), focus("3")],
          },
        ],
      }),
    ).toBe(700 + 0 + 1200);
  });
});
