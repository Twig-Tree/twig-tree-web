import { describe, expect, it } from "vitest";
import { getLabScenarioRun, LAB_SCENARIO_FIXTURES } from "./labScenarioRun";
import { getLabScenarioOutline } from "./labScenarioOutline";

const compile = (scenario: unknown) => {
  const fixture = LAB_SCENARIO_FIXTURES.find(
    ({ id }) => id === "valid/world-geography",
  );
  if (!fixture) throw new Error("fixture가 없습니다.");

  const run = getLabScenarioRun(
    JSON.stringify(scenario ?? fixture.scenario),
    fixture.compilerTree,
  );
  if (!run.success) throw new Error(JSON.stringify(run.issueGroups));

  return run;
};

describe("getLabScenarioOutline", () => {
  it.each(
    LAB_SCENARIO_FIXTURES.filter(({ kind }) => kind === "valid").map(
      (fixture) => [fixture.id, fixture] as const,
    ),
  )("%s의 모든 비트와 cue를 펼친다", (_, fixture) => {
    const run = getLabScenarioRun(
      JSON.stringify(fixture.scenario),
      fixture.compilerTree,
    );
    if (!run.success) throw new Error(JSON.stringify(run.issueGroups));

    const outline = getLabScenarioOutline(run.script, run.sourceMap);
    const scenario = fixture.scenario as {
      scenes: { beats: { cues: unknown[] }[] }[];
    };

    expect(
      outline.map(({ beats }) => beats.map(({ sources }) => sources.length)),
    ).toEqual(
      scenario.scenes.map(({ beats }) =>
        beats.map(({ cues }) => Math.max(cues.length, 1)),
      ),
    );
  });

  it("cue가 여럿이면 cue마다 순차 그룹의 자식을 붙인다", () => {
    const run = compile(undefined);
    const outline = getLabScenarioOutline(run.script, run.sourceMap);
    const beat = outline
      .flatMap(({ beats }) => beats)
      .find(({ sources }) => sources.length > 1);

    if (!beat || beat.beat.animation.type !== "group") {
      throw new Error("cue가 여럿인 비트가 없습니다.");
    }

    expect(beat.sources.map(({ animation }) => animation)).toEqual(
      beat.beat.animation.children,
    );
  });

  it("cue가 없는 비트는 컴파일러 출처로 펼친다", () => {
    const fixture = LAB_SCENARIO_FIXTURES.find(
      ({ id }) => id === "valid/world-geography",
    )!;
    const scenario = structuredClone(fixture.scenario) as {
      scenes: { beats: { cues: unknown[] }[] }[];
    };
    scenario.scenes[0].beats[0].cues = [];

    const run = compile(scenario);
    const [firstBeat] = getLabScenarioOutline(run.script, run.sourceMap)[0]
      .beats;

    expect(firstBeat.sources).toEqual([
      {
        key: "0",
        source: { type: "compiler", reason: "empty-beat" },
        animation: { type: "wait", durationMs: 0 },
      },
    ]);
  });

  it("source map이 없는 위치를 가리키면 예외로 알린다", () => {
    const run = compile(undefined);
    const beatId = run.script.scenes[0].beats[0].id;

    expect(() =>
      getLabScenarioOutline(run.script, {
        ...run.sourceMap,
        [beatId]: [
          {
            animationPath: ["children", 99],
            source: { type: "compiler", reason: "empty-beat" },
          },
        ],
      }),
    ).toThrow(beatId);
  });
});
