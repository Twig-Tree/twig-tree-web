import {
  getLectureRecipe,
  getLectureRecipeAnimation,
  LECTURE_RECIPE_REGISTRIES,
  type LectureAnimation,
  type LectureRecipeId,
  type ScenarioDelivery,
} from "@/src/entities/lecture";
import { ANIMATION_LAB_TREE } from "./fixtureTree";
import { createLabRecipeTree } from "./labRecipeTree";

export const LAB_RECIPE_REGISTRY_VERSION = 1;

export type LabRecipeId = LectureRecipeId<typeof LAB_RECIPE_REGISTRY_VERSION>;

export const LAB_RECIPE_IDS = Object.keys(
  LECTURE_RECIPE_REGISTRIES[LAB_RECIPE_REGISTRY_VERSION],
) as LabRecipeId[];

/*
recipe를 고르면 처음 채울 입력. 노드는 model/fixtureTree.ts의 고정 트리를 가리킨다.
Record로 두어 recipe를 추가하고 빠뜨리면 타입 오류가 난다.
*/
export const LAB_RECIPE_SAMPLE_INPUTS: Record<
  LabRecipeId,
  Record<string, string | string[]>
> = {
  introduce: { subject: "7", context: ["8", "9"] },
  spotlight: { subject: ["5", "6"] },
  compare: { left: ["5"], right: ["6"] },
  warn: { subject: ["9"] },
  verdict: { correctAnswer: ["5"], incorrectAnswer: ["6"] },
  "trace-path": { source: "1", destination: "12" },
  "reveal-nodes": { subject: ["8", "9"] },
  "reveal-branch": { parent: "2" },
  "tour-children": { parent: "2" },
  "collapse-summary": { subject: "3" },
  recap: { subject: ["2", "3", "4"] },
};

/*
delivery 값과 화면 이름. Record로 두어 시나리오에 값이 추가되면 타입 오류가 난다.
*/
export const LAB_DELIVERY_OPTIONS: {
  [Key in keyof ScenarioDelivery]-?: Record<
    NonNullable<ScenarioDelivery[Key]>,
    string
  >;
} = {
  pace: { slow: "느리게", normal: "보통", quick: "빠르게" },
  intensity: { subtle: "약하게", medium: "보통", strong: "강하게" },
  tone: {
    neutral: "중립",
    accent: "강조",
    positive: "긍정",
    warning: "주의",
    danger: "위험",
  },
  continuity: { transient: "비트 안", persist: "다음 비트까지" },
};

export type LabRecipeIssue = {
  path: string; // 입력 안의 위치. 입력 전체면 빈 문자열
  message: string;
};

export type LabRecipeRun =
  | { success: true; animation: LectureAnimation }
  | { success: false; issues: LabRecipeIssue[] };

export const LAB_RECIPE_TREE = createLabRecipeTree(ANIMATION_LAB_TREE); // recipe가 읽는 고정 트리

/*
함수 이름 : getLabRecipeRun
기능 : 편집 중인 JSON 입력과 delivery로 recipe를 고정 트리에서 실행한다.
인자 : LabRecipeId recipeId -> 실행할 recipe
string inputText -> recipe 입력 JSON
ScenarioDelivery delivery -> 고른 delivery. 비운 값은 recipe 기본값을 쓴다
반환값 : 애니메이션, 또는 입력 위치별 문제
*/
export const getLabRecipeRun = (
  recipeId: LabRecipeId,
  inputText: string,
  delivery: ScenarioDelivery,
): LabRecipeRun => {
  let input: unknown;

  try {
    input = JSON.parse(inputText);
  } catch {
    return {
      success: false,
      issues: [{ path: "", message: "JSON 형식이 아닙니다." }],
    };
  }

  const result = getLectureRecipeAnimation(
    getLectureRecipe(LAB_RECIPE_REGISTRY_VERSION, recipeId),
    input,
    { delivery, tree: LAB_RECIPE_TREE },
  );

  if (result.success) return result;

  return {
    success: false,
    issues: result.issues.map(({ path, message }) => ({
      path: path.map(String).join("."),
      message,
    })),
  };
};
