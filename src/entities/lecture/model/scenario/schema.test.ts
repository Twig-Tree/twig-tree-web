import { describe, expect, expectTypeOf, it } from "vitest";
import {
  type LectureScenario,
  lectureScenarioSchema,
  type ScenarioCue,
  type SemanticIntent,
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

  describe("intent별 role", () => {
    const getCueIssuePaths = (cue: unknown) => {
      const scenario = createScenario();
      scenario.scenes[0].beats[0].cues = [cue as ScenarioCue];

      return getIssuePaths(scenario).map((path) =>
        path.replace("scenes.0.beats.0.cues.0", "cue"),
      );
    };

    const validCues: Record<SemanticIntent, ScenarioCue> = {
      introduce: { intent: "introduce", roles: { subject: "1" } },
      emphasize: { intent: "emphasize", roles: { subject: ["1", "2"] } },
      compare: { intent: "compare", roles: { left: ["1"], right: ["2", "3"] } },
      decompose: { intent: "decompose", roles: { parent: "1" } },
      trace: { intent: "trace", roles: { source: "1", destination: "4" } },
      reveal: { intent: "reveal", roles: { subject: ["2"] } },
      warn: { intent: "warn", roles: { subject: ["2"] } },
      correct: {
        intent: "correct",
        roles: { correctAnswer: ["2"], incorrectAnswer: ["3"] },
      },
      incorrect: { intent: "incorrect", roles: { incorrectAnswer: ["3"] } },
      transition: { intent: "transition", roles: { destination: "5" } },
      recap: { intent: "recap", roles: { subject: ["1", "2"] } },
      summarize: {
        intent: "summarize",
        roles: { subject: "1", context: ["2", "3"] },
      },
    };

    it.each(Object.values(validCues))(
      "$intent의 유효한 role을 통과시킨다",
      (cue) => {
        expect(getCueIssuePaths(cue)).toEqual([]);
      },
    );

    it("하나만 받는 role은 문자열, 여러 개를 받는 role은 배열로 추출한다", () => {
      type Cue<Intent extends SemanticIntent> = Extract<
        ScenarioCue,
        { intent: Intent }
      >;

      expectTypeOf<Cue<"trace">["roles"]>().toEqualTypeOf<{
        source: string;
        destination: string;
      }>();
      expectTypeOf<Cue<"compare">["roles"]>().toEqualTypeOf<{
        left: string[];
        right: string[];
      }>();
      expectTypeOf<Cue<"decompose">["roles"]>().toEqualTypeOf<{
        parent: string;
        children?: string[] | undefined;
      }>();
    });

    it("필수 role이 빠지면 그 role 위치로 거부한다", () => {
      expect(
        getCueIssuePaths({ intent: "compare", roles: { left: ["1"] } }),
      ).toEqual(["cue.roles.right"]);
      expect(
        getCueIssuePaths({ intent: "trace", roles: { source: "1" } }),
      ).toEqual(["cue.roles.destination"]);
    });

    it("다른 intent의 role을 쓰면 거부한다", () => {
      expect(
        getCueIssuePaths({
          intent: "warn",
          roles: { subject: ["1"], correctAnswer: ["2"] },
        }),
      ).toEqual(["cue.roles"]);
    });

    it("개수 규칙과 다른 모양을 거부한다", () => {
      expect(
        getCueIssuePaths({ intent: "introduce", roles: { subject: ["1"] } }),
      ).toEqual(["cue.roles.subject"]);
      expect(
        getCueIssuePaths({ intent: "emphasize", roles: { subject: "1" } }),
      ).toEqual(["cue.roles.subject"]);
    });

    it("필수든 선택이든 주어진 배열이 비어 있으면 거부한다", () => {
      expect(
        getCueIssuePaths({ intent: "recap", roles: { subject: [] } }),
      ).toEqual(["cue.roles.subject"]);
      expect(
        getCueIssuePaths({
          intent: "decompose",
          roles: { parent: "1", children: [] },
        }),
      ).toEqual(["cue.roles.children"]);
    });

    it("role 안의 노드 ID 형식도 검사한다", () => {
      expect(
        getCueIssuePaths({
          intent: "compare",
          roles: { left: ["1"], right: ["2", "x"] },
        }),
      ).toContain("cue.roles.right.1");
    });
  });

  describe("관계 검사", () => {
    const getCueIssues = (cue: unknown) => {
      const scenario = createScenario();
      scenario.scenes[0].beats[0].cues = [cue as ScenarioCue];

      return getIssuePaths(scenario).map((path) =>
        path.replace("scenes.0.beats.0.cues.0", "cue"),
      );
    };

    it.each([
      [
        "compare의 양쪽이 겹치면",
        { intent: "compare", roles: { left: ["1", "2"], right: ["2"] } },
        ["cue.roles.right.0"],
      ],
      [
        "trace의 출발과 도착이 같으면",
        { intent: "trace", roles: { source: "1", destination: "1" } },
        ["cue.roles.destination"],
      ],
      [
        "정답과 오답이 겹치면",
        {
          intent: "correct",
          roles: { correctAnswer: ["2"], incorrectAnswer: ["3", "2"] },
        },
        ["cue.roles.incorrectAnswer.1"],
      ],
      [
        "decompose의 부모가 자식 목록에 있으면",
        { intent: "decompose", roles: { parent: "1", children: ["1"] } },
        ["cue.roles.children.0"],
      ],
      [
        "한 role에 같은 노드가 두 번 있으면",
        { intent: "emphasize", roles: { subject: ["1", "1"] } },
        ["cue.roles.subject.1"],
      ],
    ])("%s 두 번째 위치로 거부한다", (_, cue, paths) => {
      expect(getCueIssues(cue)).toEqual(paths);
    });

    it("scene ID와 beat ID가 시나리오 안에서 겹치면 거부한다", () => {
      const scenario = createScenario();
      scenario.scenes.push({
        ...scenario.scenes[0],
        beats: [{ ...scenario.scenes[0].beats[1] }],
      });

      expect(getIssuePaths(scenario)).toEqual([
        "scenes.1.id",
        "scenes.1.beats.0.id",
      ]);
    });

    it.each([
      { scenes: "x" },
      { scenes: [null] },
      { scenes: [{ id: 1, nodeId: "1", beats: [null] }] },
      {
        scenes: [
          {
            id: "a",
            nodeId: "1",
            beats: [
              {
                id: "b",
                narration: { text: "x" },
                cues: [
                  { intent: "compare", roles: "x" },
                  { intent: "compare", roles: { left: 5, right: ["3"] } },
                ],
              },
            ],
          },
        ],
      },
    ])("모양이 깨진 입력도 관계 검사에서 예외 없이 거부한다 %#", (broken) => {
      const result = lectureScenarioSchema.safeParse({
        ...createScenario(),
        ...broken,
      });

      expect(result.success).toBe(false);
    });

    it("다른 오류가 있어도 ID 중복을 함께 알린다", () => {
      const scenario = createScenario();
      scenario.title = "";
      scenario.scenes[0].beats[1].id = "beat-1";

      expect(getIssuePaths(scenario)).toEqual(["title", "scenes.0.beats.1.id"]);
    });
  });
});
