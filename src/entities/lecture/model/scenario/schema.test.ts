import { describe, expect, it } from "vitest";
import {
  type LectureScenario,
  lectureScenarioSchema,
} from "@/src/entities/lecture";

const createScenario = (): LectureScenario => ({
  scenarioSchemaVersion: 1,
  recipeRegistryVersion: 1,
  title: "세계 지리",
  scenes: [
    {
      id: "scene-1",
      nodeId: "12",
      beats: [
        {
          id: "beat-1",
          narration: { text: "아시아부터 살펴보겠습니다." },
          cues: [
            {
              intent: "introduce",
              roles: { subject: "12", context: ["3"] },
              delivery: { pace: "slow", tone: "accent" },
            },
          ],
        },
        {
          id: "beat-2",
          narration: { text: "내레이션만 있는 비트입니다." },
          cues: [],
        },
      ],
    },
  ],
});

const getIssuePaths = (value: unknown) => {
  const result = lectureScenarioSchema.safeParse(value);

  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
};

describe("lectureScenarioSchema", () => {
  it("유효한 시나리오를 그대로 통과시킨다", () => {
    const scenario = createScenario();

    expect(lectureScenarioSchema.parse(scenario)).toEqual(scenario);
  });

  it("delivery는 생략할 수 있다", () => {
    const scenario = createScenario();
    delete scenario.scenes[0].beats[0].cues[0].delivery;

    expect(getIssuePaths(scenario)).toEqual([]);
  });

  it("모르는 스키마 버전을 거부한다", () => {
    expect(
      getIssuePaths({ ...createScenario(), scenarioSchemaVersion: 2 }),
    ).toEqual(["scenarioSchemaVersion"]);
  });

  it("모델이 정하지 않는 시간 필드를 거부한다", () => {
    const scenario = createScenario();
    Object.assign(scenario.scenes[0].beats[0].narration, {
      fallbackDurationMs: 1000,
    });
    Object.assign(scenario.scenes[0].beats[0].cues[0], { durationMs: 500 });

    expect(getIssuePaths(scenario)).toEqual([
      "scenes.0.beats.0.narration",
      "scenes.0.beats.0.cues.0",
    ]);
  });

  it("모르는 intent를 거부한다", () => {
    const scenario = createScenario();
    Object.assign(scenario.scenes[0].beats[0].cues[0], { intent: "dance" });

    expect(getIssuePaths(scenario)).toEqual(["scenes.0.beats.0.cues.0.intent"]);
  });

  it("허용하지 않는 delivery 값을 거부한다", () => {
    const scenario = createScenario();
    Object.assign(scenario.scenes[0].beats[0].cues[0], {
      delivery: { pace: "very-fast" },
    });

    expect(getIssuePaths(scenario)).toEqual([
      "scenes.0.beats.0.cues.0.delivery.pace",
    ]);
  });

  it.each(["0", "012", "1e3", " 12", "99999999999999999999"])(
    "서버 노드 ID 형식이 아닌 %j를 거부한다",
    (nodeId) => {
      const scenario = createScenario();
      scenario.scenes[0].nodeId = nodeId;

      expect(getIssuePaths(scenario)).toContain("scenes.0.nodeId");
    },
  );

  it("빈 제목, 빈 장면, 빈 비트 목록, 빈 내레이션을 거부한다", () => {
    const scenario = createScenario();
    scenario.title = "";
    scenario.scenes[0].beats[0].narration.text = "";
    scenario.scenes[0].beats[1] = { ...scenario.scenes[0].beats[1], id: "" };

    expect(getIssuePaths(scenario)).toEqual([
      "title",
      "scenes.0.beats.0.narration.text",
      "scenes.0.beats.1.id",
    ]);
    expect(getIssuePaths({ ...createScenario(), scenes: [] })).toEqual([
      "scenes",
    ]);
    expect(
      getIssuePaths({
        ...createScenario(),
        scenes: [{ id: "scene-1", nodeId: "12", beats: [] }],
      }),
    ).toEqual(["scenes.0.beats"]);
  });
});
