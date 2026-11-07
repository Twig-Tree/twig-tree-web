import {
  getLectureRecipe,
  getLectureRecipeAnimation,
  type LectureAnimation,
  type ScenarioDelivery,
} from "@/src/entities/lecture";
import {
  LAB_RECIPE_REGISTRY_VERSION,
  LAB_RECIPE_TREE,
  type LabRecipeId,
} from "./labRecipeRun";
import { getLabStepsFromAnimation, type LabStep } from "./labTimeline";

export const LAB_PRESET_CATEGORIES = [
  "탐색",
  "비교",
  "공개",
  "강조",
  "복습",
] as const;

export type LabPresetCategory = (typeof LAB_PRESET_CATEGORIES)[number];

/*
프리셋이 부르는 recipe 하나. 노드는 model/fixtureTree.ts의 고정 트리를 가리킨다.
*/
export type LabRecipeCall = {
  recipeId: LabRecipeId;
  input: Record<string, string | string[]>; // recipe의 노드 역할. 형식은 recipe 스키마가 검사한다
  delivery?: ScenarioDelivery; // 비우면 recipe의 기본값을 쓴다
};

export type LabPreset = {
  id: string;
  category: LabPresetCategory;
  label: string;
  description: string;
  calls: LabRecipeCall[]; // 차례로 실행할 recipe. 프리셋은 동작을 직접 갖지 않는다
};

export const LAB_PRESETS: LabPreset[] = [
  {
    id: "overview-tour",
    category: "탐색",
    label: "전체 개요",
    description: "루트의 큰 갈래를 차례로 훑습니다.",
    calls: [
      {
        recipeId: "tour-children",
        input: { parent: "1" },
        delivery: { intensity: "medium" },
      },
    ],
  },
  {
    id: "follow-edge",
    category: "탐색",
    label: "연결 따라가기",
    description: "한 단계 경로를 따라가 도착점을 강조합니다.",
    calls: [
      {
        recipeId: "trace-path",
        input: { source: "2", destination: "5" },
        delivery: { intensity: "strong", tone: "positive" },
      },
    ],
  },
  {
    id: "deep-path",
    category: "탐색",
    label: "깊은 경로",
    description: "루트에서 퀵 정렬까지 단계적으로 내려갑니다.",
    calls: [
      {
        recipeId: "trace-path",
        input: { source: "1", destination: "12" },
        delivery: { pace: "slow", intensity: "strong", tone: "positive" },
      },
    ],
  },
  {
    id: "reverse-review",
    category: "탐색",
    label: "역방향 복귀",
    description: "리프에서 루트 방향으로 경로를 되짚습니다.",
    calls: [
      {
        recipeId: "trace-path",
        input: { source: "12", destination: "1" },
      },
    ],
  },
  {
    id: "sibling-tour",
    category: "탐색",
    label: "형제 순회",
    description: "같은 부모의 자식들을 차례로 소개합니다.",
    calls: [{ recipeId: "tour-children", input: { parent: "2" } }],
  },
  {
    id: "spotlight",
    category: "비교",
    label: "두 개념 집중",
    description: "비교 대상만 남기고 주변을 흐립니다.",
    calls: [{ recipeId: "spotlight", input: { subject: ["5", "6"] } }],
  },
  {
    id: "common-parent",
    category: "비교",
    label: "형제 비교",
    description: "같은 부모 아래 두 자식을 한 화면에 모아 번갈아 봅니다.",
    calls: [{ recipeId: "compare", input: { left: ["5"], right: ["6"] } }],
  },
  {
    id: "correct-wrong",
    category: "비교",
    label: "정답과 오답",
    description: "오답은 흔들고 정답은 튀어 오르게 표시합니다.",
    calls: [
      {
        recipeId: "verdict",
        input: { correctAnswer: ["5"], incorrectAnswer: ["6"] },
      },
    ],
  },
  {
    id: "branch-reveal",
    category: "공개",
    label: "가지 공개",
    description: "가지를 접어 두었다가 펼쳐 자식을 드러냅니다.",
    calls: [
      {
        recipeId: "collapse-summary",
        input: { subject: "2" },
        delivery: { pace: "quick", intensity: "subtle" },
      },
      { recipeId: "reveal-branch", input: { parent: "2" } },
    ],
  },
  {
    id: "collapse-summary",
    category: "공개",
    label: "접고 요약",
    description: "세부 내용을 접고 상위 개념에 시선을 모읍니다.",
    calls: [
      {
        recipeId: "collapse-summary",
        input: { subject: "2" },
        delivery: { tone: "positive" },
      },
    ],
  },
  {
    id: "step-expand",
    category: "공개",
    label: "한 단계씩 펼치기",
    description: "깊은 가지를 상위 단계부터 차례로 펼칩니다.",
    calls: [
      {
        recipeId: "collapse-summary",
        input: { subject: "10" },
        delivery: { pace: "quick", intensity: "subtle" },
      },
      {
        recipeId: "collapse-summary",
        input: { subject: "3" },
        delivery: { pace: "quick", intensity: "subtle" },
      },
      {
        recipeId: "reveal-branch",
        input: { parent: "3", children: ["10"] },
        delivery: { pace: "quick", intensity: "strong" },
      },
      {
        recipeId: "reveal-branch",
        input: { parent: "10" },
        delivery: { intensity: "strong", tone: "positive" },
      },
    ],
  },
  {
    id: "concept-intro",
    category: "강조",
    label: "개념 소개",
    description: "카메라 이동 후 새 개념을 또렷하게 소개합니다.",
    calls: [{ recipeId: "introduce", input: { subject: "7" } }],
  },
  {
    id: "key-point",
    category: "강조",
    label: "핵심 포인트",
    description: "주변을 흐리고 핵심 노드를 강조합니다.",
    calls: [
      {
        recipeId: "spotlight",
        input: { subject: ["12"] },
        delivery: { tone: "positive" },
      },
    ],
  },
  {
    id: "warning",
    category: "강조",
    label: "주의 사항",
    description: "주의할 개념을 경고색과 흔들림으로 표시합니다.",
    calls: [{ recipeId: "warn", input: { subject: ["9"] } }],
  },
  {
    id: "quick-review",
    category: "복습",
    label: "빠른 복습",
    description: "학습한 주요 노드를 짧게 차례로 되짚습니다.",
    calls: [{ recipeId: "recap", input: { subject: ["2", "7", "8", "9"] } }],
  },
  {
    id: "final-summary",
    category: "복습",
    label: "최종 요약",
    description: "핵심 노드들을 되짚은 뒤 한 화면에 남겨 마무리합니다.",
    calls: [
      { recipeId: "recap", input: { subject: ["2", "3", "4"] } },
      {
        recipeId: "spotlight",
        input: { subject: ["2", "3", "4"] },
        delivery: {
          intensity: "subtle",
          tone: "positive",
          continuity: "persist",
        },
      },
    ],
  },
];

/*
함수 이름 : getLabPresetAnimation
기능 : 프리셋의 recipe들을 고정 트리로 실행해 차례로 잇는다. 순차 그룹은 펼쳐 하나의 순차 그룹으로 만든다.
recipe 실패는 프리셋을 잘못 쓴 것이므로 예외로 알린다. 모든 프리셋은 테스트에서 한 번씩 실행된다.
인자 : LabPreset preset -> 프리셋
반환값 : 대본 계약의 애니메이션
*/
export const getLabPresetAnimation = (preset: LabPreset): LectureAnimation => {
  const children = preset.calls.flatMap(({ recipeId, input, delivery }) => {
    const result = getLectureRecipeAnimation(
      getLectureRecipe(LAB_RECIPE_REGISTRY_VERSION, recipeId),
      input,
      { delivery, tree: LAB_RECIPE_TREE },
    );

    if (!result.success) {
      throw new Error(
        `프리셋 ${preset.id}의 ${recipeId}를 만들 수 없습니다: ${JSON.stringify(result.issues)}`,
      );
    }

    const { animation } = result;

    return animation.type === "group" && animation.mode === "sequence"
      ? animation.children
      : [animation];
  });

  return children.length === 1
    ? children[0]
    : { type: "group", mode: "sequence", children };
};

/*
함수 이름 : createLabPresetSteps
기능 : 프리셋을 타임라인 단계로 만든다.
인자 : LabPreset preset -> 프리셋
반환값 : 타임라인 단계 목록
*/
export const createLabPresetSteps = (preset: LabPreset): LabStep[] => {
  const result = getLabStepsFromAnimation(getLabPresetAnimation(preset));

  if ("error" in result) {
    throw new Error(
      `프리셋 ${preset.id}를 타임라인으로 읽을 수 없습니다: ${result.error}`,
    );
  }

  return result.steps;
};
