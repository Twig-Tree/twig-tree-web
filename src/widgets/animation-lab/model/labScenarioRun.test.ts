import { describe, expect, it } from "vitest";
import { getLabScenarioRun, LAB_SCENARIO_FIXTURES } from "./labScenarioRun";

const getFixture = (id: string) => {
  const fixture = LAB_SCENARIO_FIXTURES.find((item) => item.id === id);
  if (!fixture) throw new Error(`${id} fixture가 없습니다.`);
  return fixture;
};

const runFixture = (id: string, scenario?: unknown) => {
  const fixture = getFixture(id);
  return getLabScenarioRun(
    JSON.stringify(scenario ?? fixture.scenario),
    fixture.compilerTree,
  );
};

describe("LAB_SCENARIO_FIXTURES", () => {
  it("같은 트리를 쓰는 fixture는 같은 트리 ID를 쓴다", () => {
    expect(getFixture("invalid/missing-role").treeId).toBe(
      getFixture("valid/world-geography").treeId,
    );
  });

  it("트리 ID는 숫자가 아니다", () => {
    for (const { treeId } of LAB_SCENARIO_FIXTURES) {
      expect(treeId).not.toMatch(/^\d+$/);
    }
  });
});

describe("getLabScenarioRun", () => {
  it.each(
    LAB_SCENARIO_FIXTURES.filter(({ kind }) => kind === "valid").map(
      ({ id }) => id,
    ),
  )("%s는 컴파일되고 장면 사이에 효과를 지운다", (id) => {
    const run = runFixture(id);

    if (!run.success) throw new Error(JSON.stringify(run.issueGroups));

    const { animation, script } = run;
    const resets =
      animation.type === "group"
        ? animation.children.filter((child) => child.type === "reset")
        : [];

    expect(resets).toHaveLength(script.scenes.length - 1);
  });

  it.each(
    LAB_SCENARIO_FIXTURES.filter(({ kind }) => kind === "invalid").map(
      ({ id }) => id,
    ),
  )("%s는 문제를 보여 준다", (id) => {
    const run = runFixture(id);

    expect(run.success).toBe(false);
    expect(!run.success && run.issueGroups.length).toBeGreaterThan(0);
  });

  it("cue의 문제는 cue 위치로 묶고 그 안의 경로만 남긴다", () => {
    const run = runFixture("invalid/missing-role");

    expect(!run.success && run.issueGroups).toEqual([
      {
        key: "scenes.0.beats.0.cues.0",
        label: "장면 asia › 비트 asia-1 › cue 1 (compare)",
        issues: [expect.objectContaining({ path: "roles.right" })],
      },
    ]);
  });

  it("트리에 없는 노드는 node 단계 문제로 알린다", () => {
    const fixture = getFixture("valid/http-request-flow");
    const scenario = structuredClone(fixture.scenario) as {
      scenes: { beats: { cues: { roles: Record<string, unknown> }[] }[] }[];
    };
    scenario.scenes[0].beats[0].cues[0].roles.subject = "99";

    const run = runFixture(fixture.id, scenario);

    expect(!run.success && run.issueGroups[0]).toMatchObject({
      key: "scenes.0.beats.0.cues.0",
      issues: [{ stage: "node", path: "roles.subject" }],
    });
  });

  it("JSON이 아니면 시나리오 전체의 문제로 알린다", () => {
    const run = getLabScenarioRun(
      "{",
      getFixture("valid/world-geography").compilerTree,
    );

    expect(!run.success && run.issueGroups[0].issues[0].stage).toBe("json");
  });
});
