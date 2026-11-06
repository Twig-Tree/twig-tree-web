import { type LectureAnimationAction } from "@/src/entities/lecture";
import { createLabStep, type LabStep } from "./labTimeline";

export const LAB_PRESET_CATEGORIES = [
  "탐색",
  "비교",
  "공개",
  "강조",
  "복습",
] as const;

export type LabPresetCategory = (typeof LAB_PRESET_CATEGORIES)[number];

export type LabPreset = {
  id: string;
  category: LabPresetCategory;
  label: string;
  description: string;
  createSteps: () => LabStep[];
};

type HighlightStyle = Extract<
  LectureAnimationAction,
  { type: "highlight" }
>["style"];
type HighlightTone = NonNullable<
  Extract<LectureAnimationAction, { type: "highlight" }>["tone"]
>;

const highlight = (
  targetNodeIds: string[],
  durationMs: number,
  style: HighlightStyle = "pulse",
  tone: HighlightTone = "accent",
  persist = false,
): LectureAnimationAction => ({
  type: "highlight",
  targetNodeIds,
  style,
  tone,
  durationMs,
  ...(persist ? { persist } : {}),
});

const wait = (durationMs: number): LectureAnimationAction => ({
  type: "wait",
  durationMs,
});

const trace = (
  nodeIds: string[],
  durationMs: number,
  direction: "forward" | "reverse" = "forward",
  persist = false,
): LectureAnimationAction => ({
  type: "trace",
  nodeIds,
  durationMs,
  mode: "progressive",
  direction,
  ...(persist ? { persist } : {}),
});

/* 노드 ID는 model/fixtureTree.ts의 고정 트리를 가리킨다. */
const PRESET_DURATION_SCALE = 1.3;

const scalePresetAction = (
  action: LectureAnimationAction,
): LectureAnimationAction => {
  if (action.type === "reset") return action;

  return {
    ...action,
    durationMs:
      Math.round((action.durationMs * PRESET_DURATION_SCALE) / 50) * 50,
  };
};

const BASE_LAB_PRESETS: LabPreset[] = [
  {
    id: "overview-tour",
    category: "탐색",
    label: "전체 개요",
    description: "루트에서 큰 갈래를 차례로 훑습니다.",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["1", "2", "3", "4"],
        maxZoom: 1,
        durationMs: 700,
      }),
      createLabStep(highlight(["1"], 500, "pop")),
      createLabStep(highlight(["2"], 450)),
      createLabStep(highlight(["3"], 450)),
      createLabStep(highlight(["4"], 450)),
    ],
  },
  {
    id: "follow-edge",
    category: "탐색",
    label: "연결 따라가기",
    description: "한 단계 경로를 따라가 도착점을 강조합니다.",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["2", "5"],
        maxZoom: 1.3,
        durationMs: 500,
      }),
      createLabStep(trace(["2", "5"], 900)),
      createLabStep(highlight(["5"], 700, "pop", "success")),
    ],
  },
  {
    id: "deep-path",
    category: "탐색",
    label: "깊은 경로",
    description: "루트에서 퀵 정렬까지 단계적으로 내려갑니다.",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["1", "3", "10", "12"],
        maxZoom: 1,
        durationMs: 800,
      }),
      createLabStep(trace(["1", "3", "10", "12"], 1800, "forward", true)),
      createLabStep(highlight(["12"], 900, "pop", "success")),
      createLabStep({ type: "reset", scope: "visual" }),
    ],
  },
  {
    id: "reverse-review",
    category: "탐색",
    label: "역방향 복귀",
    description: "리프에서 루트 방향으로 경로를 되짚습니다.",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["1", "3", "10", "12"],
        maxZoom: 1,
        durationMs: 700,
      }),
      createLabStep(highlight(["12"], 500, "pop")),
      createLabStep(trace(["1", "3", "10", "12"], 1700, "reverse")),
      createLabStep(highlight(["1"], 600)),
    ],
  },
  {
    id: "sibling-tour",
    category: "탐색",
    label: "형제 순회",
    description: "같은 부모의 자식들을 차례로 소개합니다.",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["2", "5", "6", "7"],
        maxZoom: 1.1,
        durationMs: 600,
      }),
      createLabStep(highlight(["5"], 500, "pop")),
      createLabStep(highlight(["6"], 500, "pop")),
      createLabStep(highlight(["7"], 500, "pop")),
    ],
  },
  {
    id: "spotlight",
    category: "비교",
    label: "두 개념 집중",
    description: "비교 대상만 남기고 주변을 흐립니다.",
    createSteps: () => [
      createLabStep({
        type: "dim",
        exceptNodeIds: ["5", "6"],
        durationMs: 1500,
      }),
      createLabStep(highlight(["5"], 1500, "steady"), true),
      createLabStep(highlight(["6"], 1500, "pulse", "success"), true),
    ],
  },
  {
    id: "common-parent",
    category: "비교",
    label: "부모와 자식 비교",
    description: "공통 부모를 유지하며 두 자식을 번갈아 봅니다.",
    createSteps: () => [
      createLabStep(highlight(["2"], 0, "steady", "accent", true)),
      createLabStep(highlight(["5"], 650, "pulse", "success")),
      createLabStep(highlight(["6"], 650, "pulse", "warning")),
      createLabStep({ type: "reset", scope: "visual" }),
    ],
  },
  {
    id: "correct-wrong",
    category: "비교",
    label: "정답과 오답",
    description: "오답은 흔들고 정답은 튀어 오르게 표시합니다.",
    createSteps: () => [
      createLabStep(highlight(["6"], 850, "shake", "danger")),
      createLabStep(wait(250)),
      createLabStep(highlight(["5"], 850, "bounce", "success")),
    ],
  },
  {
    id: "branch-reveal",
    category: "공개",
    label: "가지 공개",
    description: "접힌 가지를 펼친 뒤 자식을 순서대로 소개합니다.",
    createSteps: () => [
      createLabStep({
        type: "collapse",
        targetNodeIds: ["2"],
        durationMs: 650,
      }),
      createLabStep(wait(350)),
      createLabStep({ type: "expand", targetNodeIds: ["2"], durationMs: 750 }),
      createLabStep(highlight(["5"], 400, "pop")),
      createLabStep(highlight(["6"], 400, "pop")),
      createLabStep(highlight(["7"], 400, "pop")),
    ],
  },
  {
    id: "collapse-summary",
    category: "공개",
    label: "접고 요약",
    description: "세부 내용을 접고 상위 개념에 시선을 모읍니다.",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["2", "5", "6", "7"],
        maxZoom: 1,
        durationMs: 600,
      }),
      createLabStep({
        type: "collapse",
        targetNodeIds: ["2"],
        durationMs: 800,
      }),
      createLabStep(highlight(["2"], 900, "pulse", "success")),
    ],
  },
  {
    id: "step-expand",
    category: "공개",
    label: "한 단계씩 펼치기",
    description: "깊은 가지를 상위 단계부터 차례로 펼칩니다.",
    createSteps: () => [
      createLabStep({
        type: "collapse",
        targetNodeIds: ["3"],
        durationMs: 600,
      }),
      createLabStep({ type: "expand", targetNodeIds: ["3"], durationMs: 650 }),
      createLabStep(highlight(["10"], 450, "pop")),
      createLabStep({ type: "expand", targetNodeIds: ["10"], durationMs: 650 }),
      createLabStep(highlight(["12"], 650, "pop", "success")),
    ],
  },
  {
    id: "concept-intro",
    category: "강조",
    label: "개념 소개",
    description: "카메라 이동 후 새 개념을 또렷하게 소개합니다.",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["7"],
        maxZoom: 1.4,
        durationMs: 650,
      }),
      createLabStep(highlight(["7"], 800, "pop")),
      createLabStep(highlight(["7"], 900, "steady")),
    ],
  },
  {
    id: "key-point",
    category: "강조",
    label: "핵심 포인트",
    description: "주변을 흐리고 핵심 노드를 계속 강조합니다.",
    createSteps: () => [
      createLabStep({ type: "dim", exceptNodeIds: ["12"], durationMs: 1400 }),
      createLabStep(highlight(["12"], 1400, "pulse", "success"), true),
    ],
  },
  {
    id: "warning",
    category: "강조",
    label: "주의 사항",
    description: "주의할 개념을 경고색과 흔들림으로 표시합니다.",
    createSteps: () => [
      createLabStep(highlight(["9"], 1200, "shake", "warning")),
      createLabStep(wait(250)),
      createLabStep(highlight(["9"], 700, "steady", "warning")),
    ],
  },
  {
    id: "quick-review",
    category: "복습",
    label: "빠른 복습",
    description: "학습한 주요 노드를 짧게 차례로 되짚습니다.",
    createSteps: () => [
      createLabStep(highlight(["2"], 350)),
      createLabStep(highlight(["7"], 350)),
      createLabStep(highlight(["8"], 350)),
      createLabStep(highlight(["9"], 350)),
    ],
  },
  {
    id: "final-summary",
    category: "복습",
    label: "최종 요약",
    description: "핵심 노드들을 한 화면에 남겨 마무리합니다.",
    createSteps: () => [
      createLabStep({ type: "reset", scope: "all" }),
      createLabStep({
        type: "focus",
        targetNodeIds: ["2", "3", "4"],
        maxZoom: 1,
        durationMs: 700,
      }),
      createLabStep({
        type: "dim",
        exceptNodeIds: ["2", "3", "4"],
        durationMs: 1500,
        persist: true,
      }),
      createLabStep(
        highlight(["2", "3", "4"], 1500, "steady", "success", true),
        true,
      ),
    ],
  },
];

export const LAB_PRESETS: LabPreset[] = BASE_LAB_PRESETS.map((preset) => ({
  ...preset,
  createSteps: () =>
    preset
      .createSteps()
      .map((step) => ({ ...step, action: scalePresetAction(step.action) })),
}));
