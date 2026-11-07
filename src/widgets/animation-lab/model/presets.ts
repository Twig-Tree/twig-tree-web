import { type LectureAnimationAction } from "@/src/entities/lecture";
import { createLabStep, type LabStep } from "./labTimeline";

type LabPreset = {
  id: string;
  label: string;
  createSteps: () => LabStep[];
};

const pulse = (
  targetNodeIds: string[],
  durationMs: number,
): LectureAnimationAction => ({
  type: "highlight",
  targetNodeIds,
  style: "pulse",
  durationMs,
});

/*
노드 ID는 model/fixtureTree.ts의 고정 트리를 가리킨다.
*/
export const LAB_PRESETS: LabPreset[] = [
  {
    id: "follow-edge",
    label: "연결 따라가기",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["2", "5"],
        maxZoom: 1.3,
        durationMs: 500,
      }),
      createLabStep({
        type: "highlight",
        targetNodeIds: ["2"],
        style: "steady",
        durationMs: 500,
      }),
      createLabStep({ type: "trace", nodeIds: ["2", "5"], durationMs: 1200 }),
      createLabStep(pulse(["5"], 700)),
    ],
  },
  {
    id: "spotlight",
    label: "주변 흐리고 집중",
    createSteps: () => [
      createLabStep(pulse(["2"], 1400)),
      createLabStep(
        { type: "dim", exceptNodeIds: ["2", "5"], durationMs: 1400 },
        true,
      ),
      createLabStep(
        { type: "trace", nodeIds: ["2", "5"], durationMs: 1400 },
        true,
      ),
    ],
  },
  {
    id: "collapse-branch",
    label: "접었다 펼치기",
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
      createLabStep(pulse(["2"], 700)),
      createLabStep({ type: "expand", targetNodeIds: ["2"], durationMs: 800 }),
    ],
  },
  {
    id: "deep-path",
    label: "깊은 경로 펼치기",
    createSteps: () => [
      createLabStep({
        type: "focus",
        targetNodeIds: ["1", "3", "10", "12"],
        maxZoom: 1,
        durationMs: 800,
      }),
      createLabStep({
        type: "trace",
        nodeIds: ["1", "3", "10", "12"],
        durationMs: 1800,
      }),
      createLabStep(pulse(["12"], 900)),
      createLabStep({ type: "reset", scope: "camera" }),
    ],
  },
];
