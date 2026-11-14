import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  type LectureEffectAction,
  type LectureEffectType,
} from "./atomicEffects";
import {
  getReducedMotionAction,
  getReducedMotionAnimation,
} from "./reducedMotion";
import { compileLectureScenario } from "./compiler/compileLectureScenario";
import {
  createLectureCompilerTree,
  type LectureCompilerTreeNode,
} from "./compiler/createLectureCompilerTree";
import { DEMO_LECTURES } from "./demoLectures";
import { lectureScriptSchema } from "./scriptSchema";
import { type LectureAnimation, type LectureScript } from "./types";

/*
Record로 두어 동작을 추가하고 기대값을 빠뜨리면 타입 오류가 난다.
*/
const CASES: {
  [T in LectureEffectType]: {
    input: LectureEffectAction<T>;
    expected: LectureEffectAction<T>;
  };
} = {
  focus: {
    input: {
      type: "focus",
      targetNodeIds: ["1"],
      maxZoom: 1.2,
      durationMs: 700,
    },
    expected: {
      type: "focus",
      targetNodeIds: ["1"],
      maxZoom: 1.2,
      durationMs: 0,
    },
  },
  highlight: {
    input: {
      type: "highlight",
      targetNodeIds: ["1"],
      style: "shake",
      tone: "danger",
      durationMs: 1200,
    },
    expected: {
      type: "highlight",
      targetNodeIds: ["1"],
      style: "steady",
      tone: "danger",
      durationMs: 1200,
    },
  },
  /*
  꼬리표가 튀어나오는 등장은 CSS가 끄므로 대본은 그대로다. 글자와 유지 여부가 내용이다.
  */
  badge: {
    input: {
      type: "badge",
      targetNodeIds: ["1"],
      label: "정답",
      tone: "success",
      durationMs: 1200,
      persist: true,
    },
    expected: {
      type: "badge",
      targetNodeIds: ["1"],
      label: "정답",
      tone: "success",
      durationMs: 1200,
      persist: true,
    },
  },
  dim: {
    input: { type: "dim", exceptNodeIds: ["1"], durationMs: 1800 },
    expected: { type: "dim", exceptNodeIds: ["1"], durationMs: 1800 },
  },
  trace: {
    input: {
      type: "trace",
      nodeIds: ["1", "2", "3"],
      durationMs: 1300,
      mode: "progressive",
      direction: "reverse",
    },
    expected: {
      type: "trace",
      nodeIds: ["1", "2", "3"],
      durationMs: 1300,
      mode: "simultaneous",
      direction: "reverse",
    },
  },
  wait: {
    input: { type: "wait", durationMs: 450 },
    expected: { type: "wait", durationMs: 450 },
  },
  collapse: {
    input: { type: "collapse", targetNodeIds: ["1"], durationMs: 850 },
    expected: { type: "collapse", targetNodeIds: ["1"], durationMs: 850 },
  },
  expand: {
    input: { type: "expand", targetNodeIds: ["1"], durationMs: 850 },
    expected: { type: "expand", targetNodeIds: ["1"], durationMs: 850 },
  },
  reset: {
    input: { type: "reset", scope: "all" },
    expected: { type: "reset", scope: "all" },
  },
};

describe("getReducedMotionAction", () => {
  it.each(Object.entries(CASES))(
    "%s 동작을 정책에 맞게 바꾼다",
    (_, { input, expected }) => {
      expect(getReducedMotionAction(input)).toEqual(expected);
    },
  );

  it("이미 멈춘 꾸밈은 같은 객체를 돌려준다", () => {
    const steady: LectureEffectAction<"highlight"> = {
      type: "highlight",
      targetNodeIds: ["1"],
      style: "steady",
      durationMs: 1200,
    };

    expect(getReducedMotionAction(steady)).toBe(steady);
  });

  it("원래 동작을 바꾸지 않는다", () => {
    const input = structuredClone(CASES.focus.input);

    getReducedMotionAction(input);

    expect(input).toEqual(CASES.focus.input);
  });
});

describe("getReducedMotionAnimation", () => {
  it("중첩 그룹의 구조는 두고 안의 동작만 바꾼다", () => {
    const animation: LectureAnimation = {
      type: "group",
      mode: "sequence",
      children: [
        CASES.focus.input,
        {
          type: "group",
          mode: "parallel",
          children: [CASES.highlight.input, CASES.wait.input],
        },
      ],
    };

    expect(getReducedMotionAnimation(animation)).toEqual({
      type: "group",
      mode: "sequence",
      children: [
        CASES.focus.expected,
        {
          type: "group",
          mode: "parallel",
          children: [CASES.highlight.expected, CASES.wait.expected],
        },
      ],
    });
  });
});

const fixtureDirectory = join(import.meta.dirname, "scenario/fixtures"); // jsdom 환경에서는 file URL을 만들 수 없어 경로로 읽는다

const readFixture = (...paths: string[]): unknown =>
  JSON.parse(readFileSync(join(fixtureDirectory, ...paths), "utf8"));

const getFixtureScripts = (): [string, LectureScript][] =>
  readdirSync(join(fixtureDirectory, "valid"))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => {
      const result = compileLectureScenario(readFixture("valid", fileName), {
        scriptId: fileName,
        tree: createLectureCompilerTree(
          readFixture("trees", fileName) as LectureCompilerTreeNode[],
        ),
      });

      if (!result.success) throw new Error(`${fileName} 컴파일 실패`);

      return [`fixture ${fileName}`, result.script];
    });

const getDemoScripts = (): [string, LectureScript][] => {
  let nextNodeId = 0;

  return DEMO_LECTURES.map((lecture, index) => {
    const script = lecture.createScript(() => {
      nextNodeId += 1;
      return String(nextNodeId);
    });

    if (script === null) throw new Error(`데모 ${index} 대본 생성 실패`);

    return [`데모 ${script.id}`, script];
  });
};

/*
함수 이름 : getAnimationMeaning
기능 : 동작 줄이기 정책이 바꿔도 되는 필드(카메라 이동 시간, 꾸밈 모양, 추적 방식)를 뺀 애니메이션을 만든다.
인자 : LectureAnimation animation -> 비트의 애니메이션
반환값 : 정보 의미만 남긴 애니메이션. 그룹 구조, 동작 순서, 대상 노드, 유지 여부, 톤, 쉬는 시간이 남는다
*/
const getAnimationMeaning = (animation: LectureAnimation): unknown => {
  if (animation.type === "group") {
    return {
      ...animation,
      children: animation.children.map(getAnimationMeaning),
    };
  }

  const meaning: Record<string, unknown> = { ...animation };

  if (animation.type === "focus") delete meaning.durationMs;
  if (animation.type === "highlight") delete meaning.style;
  if (animation.type === "trace") delete meaning.mode;

  return meaning;
};

/*
함수 이름 : getPolicyViolations
기능 : 줄인 애니메이션에 정책이 바꿨어야 할 값이 남아 있는지 찾는다. 의미 비교는 바꿔도 되는 필드를 빼고 보므로 이 값은 따로 본다.
인자 : LectureAnimation animation -> 줄인 애니메이션
반환값 : 남아 있는 값의 설명 목록
*/
const getPolicyViolations = (animation: LectureAnimation): string[] => {
  if (animation.type === "group") {
    return animation.children.flatMap(getPolicyViolations);
  }

  if (animation.type === "focus" && animation.durationMs !== 0) {
    return [`focus ${animation.durationMs}ms`];
  }
  if (animation.type === "highlight" && animation.style !== "steady") {
    return [`highlight ${animation.style}`];
  }
  if (animation.type === "trace" && animation.mode === "progressive") {
    return ["progressive trace"];
  }

  return [];
};

describe("동작 줄이기 대본의 정보 의미", () => {
  const scripts = [...getFixtureScripts(), ...getDemoScripts()];

  it.each(scripts)(
    "%s는 비트마다 같은 노드와 같은 동작 순서를 갖고 스키마를 통과한다",
    (_, script) => {
      const reducedScript: LectureScript = {
        ...script,
        scenes: script.scenes.map((scene) => ({
          ...scene,
          beats: scene.beats.map((beat) => ({
            ...beat,
            animation: getReducedMotionAnimation(beat.animation),
          })),
        })),
      };

      reducedScript.scenes.forEach((scene, sceneIndex) =>
        scene.beats.forEach((beat, beatIndex) =>
          expect(getAnimationMeaning(beat.animation)).toEqual(
            getAnimationMeaning(
              script.scenes[sceneIndex].beats[beatIndex].animation,
            ),
          ),
        ),
      );
      expect(
        reducedScript.scenes.flatMap((scene) =>
          scene.beats.flatMap((beat) => getPolicyViolations(beat.animation)),
        ),
      ).toEqual([]);
      expect(lectureScriptSchema.safeParse(reducedScript).success).toBe(true);
    },
  );

  /*
  줄일 동작이 하나도 없으면 위 검사는 아무것도 확인하지 않는다.
  */
  it("검사 대상에 동작 줄이기가 바꾸는 동작이 있다", () => {
    const changedBeatCount = scripts
      .flatMap(([, script]) => script.scenes.flatMap((scene) => scene.beats))
      .filter(
        (beat) =>
          JSON.stringify(getReducedMotionAnimation(beat.animation)) !==
          JSON.stringify(beat.animation),
      ).length;

    expect(changedBeatCount).toBeGreaterThan(0);
  });
});
