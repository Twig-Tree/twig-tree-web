import {
  type LectureEffectAction,
  type LectureEffectType,
} from "@/src/entities/lecture";

type LabActionDefinition<T extends LectureEffectType> = {
  label: string; // 단계 추가 버튼과 재생 중 표시에 쓰는 이름
  createDefault: () => LectureEffectAction<T>; // 새로 추가할 단계의 기본값. 대상 노드는 비워 둔다
};

/*
랩 화면에서만 쓰는 동작 정보. 대본 계약과 실행 성격은 entity의 LECTURE_ATOMIC_EFFECTS가 갖고,
이름과 기본값은 실험 화면의 편의라 이 widget에 둔다. Record라서 동작을 추가하면 여기도 채워야 한다.
*/
export const LAB_ACTIONS: {
  [T in LectureEffectType]: LabActionDefinition<T>;
} = {
  focus: {
    label: "Focus",
    createDefault: () => ({
      type: "focus",
      targetNodeIds: [],
      maxZoom: 1.3,
      durationMs: 800,
    }),
  },
  highlight: {
    label: "Highlight",
    createDefault: () => ({
      type: "highlight",
      targetNodeIds: [],
      style: "pulse",
      tone: "accent",
      durationMs: 1200,
    }),
  },
  dim: {
    label: "Dim",
    createDefault: () => ({ type: "dim", exceptNodeIds: [], durationMs: 1200 }),
  },
  trace: {
    label: "Trace",
    createDefault: () => ({
      type: "trace",
      nodeIds: [],
      mode: "progressive",
      direction: "forward",
      durationMs: 1600,
    }),
  },
  badge: {
    label: "Badge",
    createDefault: () => ({
      type: "badge",
      targetNodeIds: [],
      label: "핵심",
      tone: "accent",
      durationMs: 1600,
    }),
  },
  wait: {
    label: "Wait",
    createDefault: () => ({ type: "wait", durationMs: 800 }),
  },
  collapse: {
    label: "Collapse",
    createDefault: () => ({
      type: "collapse",
      targetNodeIds: [],
      durationMs: 1100,
    }),
  },
  expand: {
    label: "Expand",
    createDefault: () => ({
      type: "expand",
      targetNodeIds: [],
      durationMs: 1100,
    }),
  },
  reset: {
    label: "Reset",
    createDefault: () => ({ type: "reset", scope: "visual" }),
  },
};
