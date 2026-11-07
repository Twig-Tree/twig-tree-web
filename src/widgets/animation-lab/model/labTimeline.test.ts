import { describe, expect, it } from "vitest";
import {
  LECTURE_EFFECT_TYPES,
  lectureAnimationActionSchema,
  type LectureHighlightAction,
  type LectureTraceAction,
} from "@/src/entities/lecture";
import { ANIMATION_LAB_TREE } from "./fixtureTree";
import {
  createDefaultLabAction,
  createLabStep,
  getLabAnimation,
  getLabStepsFromJson,
} from "./labTimeline";
import { LAB_PRESETS } from "./presets";
import { validateLabAction } from "./validateLabStep";

const pulse: LectureHighlightAction = {
  type: "highlight",
  targetNodeIds: [],
  style: "pulse",
  durationMs: 900,
};
const trace: LectureTraceAction = {
  type: "trace",
  nodeIds: [],
  durationMs: 1200,
};

describe("getLabAnimation", () => {
  it("단계가 하나면 그룹으로 감싸지 않는다", () => {
    expect(getLabAnimation([createLabStep(pulse)])).toEqual(pulse);
  });

  it("동시에 시작하는 단계를 병렬 그룹으로 묶어 순서대로 잇는다", () => {
    expect(
      getLabAnimation([
        createLabStep(pulse),
        createLabStep(trace),
        createLabStep(pulse, true),
      ]),
    ).toEqual({
      type: "group",
      mode: "sequence",
      children: [
        pulse,
        { type: "group", mode: "parallel", children: [trace, pulse] },
      ],
    });
  });

  it("첫 단계의 동시 시작은 묶을 앞 단계가 없어 무시한다", () => {
    expect(getLabAnimation([createLabStep(pulse, true)])).toEqual(pulse);
  });
});

describe("getLabStepsFromJson", () => {
  it("타임라인이 만든 JSON을 같은 구조로 다시 읽는다", () => {
    const animation = getLabAnimation([
      createLabStep(pulse),
      createLabStep(trace),
      createLabStep(pulse, true),
    ]);

    const result = getLabStepsFromJson(JSON.stringify(animation));

    if ("error" in result) throw new Error(result.error);
    expect(getLabAnimation(result.steps)).toEqual(animation);
  });

  it("맨 위의 병렬 그룹도 읽는다", () => {
    const result = getLabStepsFromJson(
      JSON.stringify({
        type: "group",
        mode: "parallel",
        children: [pulse, trace],
      }),
    );

    if ("error" in result) throw new Error(result.error);
    expect(result.steps.map((step) => step.withPrevious)).toEqual([
      false,
      true,
    ]);
  });

  it("확장된 강조·추적과 wait를 JSON에서 읽는다", () => {
    const animation = {
      type: "group",
      mode: "sequence",
      children: [
        {
          type: "highlight",
          targetNodeIds: ["1"],
          style: "bounce",
          tone: "success",
          durationMs: 500,
        },
        { type: "wait", durationMs: 250 },
        {
          type: "trace",
          nodeIds: ["1", "2"],
          durationMs: 800,
          mode: "progressive",
          direction: "reverse",
          persist: true,
        },
      ],
    };

    const result = getLabStepsFromJson(JSON.stringify(animation));
    if ("error" in result) throw new Error(result.error);

    expect(getLabAnimation(result.steps)).toEqual(animation);
  });

  it.each([
    ["문법 오류", "{"],
    ["없는 동작", JSON.stringify({ type: "shake", durationMs: 100 })],
    ["필드 누락", JSON.stringify({ type: "trace", nodeIds: ["1"] })],
    [
      "빈 순차 그룹",
      JSON.stringify({ type: "group", mode: "sequence", children: [] }),
    ],
    [
      "병렬 안의 그룹",
      JSON.stringify({
        type: "group",
        mode: "parallel",
        children: [{ type: "group", mode: "sequence", children: [pulse] }],
      }),
    ],
  ])("%s는 안내 문구를 돌려준다", (_, text) => {
    expect(getLabStepsFromJson(text)).toHaveProperty("error");
  });
});

describe("validateLabAction", () => {
  it("대상이 없는 동작을 알려 준다", () => {
    expect(validateLabAction(pulse, ANIMATION_LAB_TREE)).not.toBeNull();
  });

  it("트리에 없는 노드를 알려 준다", () => {
    expect(
      validateLabAction(
        { ...pulse, targetNodeIds: ["999"] },
        ANIMATION_LAB_TREE,
      ),
    ).not.toBeNull();
  });

  it("부모에서 자식으로 이어지는 경로만 통과시킨다", () => {
    expect(
      validateLabAction(
        { ...trace, nodeIds: ["2", "7", "8"] },
        ANIMATION_LAB_TREE,
      ),
    ).toBeNull();
    expect(
      validateLabAction({ ...trace, nodeIds: ["2", "8"] }, ANIMATION_LAB_TREE),
    ).not.toBeNull();
    expect(
      validateLabAction({ ...trace, nodeIds: ["7", "2"] }, ANIMATION_LAB_TREE),
    ).not.toBeNull();
  });

  it.each(LAB_PRESETS.map((preset) => [preset.label, preset] as const))(
    "프리셋 %s는 바로 재생할 수 있다",
    (_, preset) => {
      for (const step of preset.createSteps()) {
        expect(validateLabAction(step.action, ANIMATION_LAB_TREE)).toBeNull();
      }
    },
  );

  it("프리셋 동작 시간을 공통 배율로 느리게 조정한다", () => {
    const overview = LAB_PRESETS.find(
      (preset) => preset.id === "overview-tour",
    );
    const steps = overview?.createSteps();

    expect(steps?.[0].action).toMatchObject({ durationMs: 900 });
    expect(steps?.[1].action).toMatchObject({ durationMs: 650 });
  });
});

describe("createDefaultLabAction", () => {
  it.each(LECTURE_EFFECT_TYPES)(
    "%s의 기본값은 대본 스키마를 통과한다",
    (type) => {
      const action = createDefaultLabAction(type);

      expect(action.type).toBe(type);
      expect(lectureAnimationActionSchema.safeParse(action).success).toBe(true);
    },
  );
});

describe("getLabStepsFromJson의 스키마 검사", () => {
  it("허용하지 않는 값이 있는 동작을 거부한다", () => {
    expect(
      getLabStepsFromJson(
        JSON.stringify({
          type: "highlight",
          targetNodeIds: ["1"],
          style: "wobble",
          durationMs: 100,
        }),
      ),
    ).toHaveProperty("error");
  });

  it("빈 병렬 그룹을 거부한다", () => {
    expect(
      getLabStepsFromJson(
        JSON.stringify({
          type: "group",
          mode: "sequence",
          children: [{ type: "group", mode: "parallel", children: [] }],
        }),
      ),
    ).toHaveProperty("error");
  });
});
