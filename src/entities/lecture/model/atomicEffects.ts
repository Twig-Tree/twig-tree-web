import type * as z from "zod/mini";
import {
  lectureBadgeActionSchema,
  lectureCollapseActionSchema,
  lectureDimActionSchema,
  lectureExpandActionSchema,
  lectureFocusActionSchema,
  lectureHighlightActionSchema,
  lectureResetActionSchema,
  lectureTraceActionSchema,
  lectureWaitActionSchema,
} from "./scriptSchema";
import { type LectureAnimationAction } from "./types";

/*
atomic effect는 플레이어가 실행하는 가장 작은 동작이다. 외부 모델에는 노출하지 않는 내부 계약이며,
랩·편집기·검증기가 동작마다 다른 사실을 각자 switch로 다시 쓰지 않도록 이 registry 한 곳에 모은다.

ID는 대본 JSON의 type 값이다. 저장된 대본이 깨지지 않도록 기존 ID는 바꾸지 않는다.
노드가 아닌 대상(예: 텍스트)을 다루는 동작이 생기면 "<대상>.<동작>" 형식(text.typewriter)으로 짓고 target.family에 대상을 더한다.
*/
export type LectureEffectType = LectureAnimationAction["type"];

export type LectureEffectAction<T extends LectureEffectType> = Extract<
  LectureAnimationAction,
  { type: T }
>;

/*
동작에서 노드 ID 목록을 담는 필드 이름. 동작마다 이름이 달라(targetNodeIds, exceptNodeIds, nodeIds) 타입에서 직접 뽑는다.
*/
type NodeIdsField<A> = {
  [K in keyof A]-?: A[K] extends string[] ? K : never;
}[keyof A];

/*
모든 동작의 노드 ID 목록 필드 이름. 편집기처럼 필드 이름을 다른 이름으로 옮겨 적는 쪽이 빠짐없이 대응했는지 확인할 때 쓴다.
*/
export type LectureEffectNodeIdsField = LectureAnimationAction extends infer A
  ? A extends LectureAnimationAction
    ? NodeIdsField<A>
    : never
  : never;

export type LectureEffectTarget<T extends LectureEffectType> =
  NodeIdsField<LectureEffectAction<T>> extends never
    ? null
    : {
        family: "node"; // 대상의 종류. 텍스트 효과가 생기면 "text"를 더한다
        field: NodeIdsField<LectureEffectAction<T>>; // 노드 ID 목록을 담는 필드
      };

/*
durationMs의 뜻.
- effect: 효과가 보이는 시간
- hold: 다음 동작까지 기다리는 시간. 움직임 자체는 편집기가 정한 시간으로 그린다(collapse, expand)
- none: durationMs가 없다
*/
type DurationMeaning = "effect" | "hold" | "none";

/*
움직임의 성격. 동작 줄이기(reduced-motion)에서 어떤 대체를 할지 정하는 기준이다. 대체 방법은 reducedMotion.ts에 있다.
- camera: 화면이 이동한다
- layout: 노드 배치가 바뀌며 노드가 움직인다
- decoration: 노드나 연결선의 꾸밈이 바뀐다. 스타일에 따라 반복해서 움직일 수 있다
- none: 화면에 보이는 움직임이 없다
*/
type MotionKind = "camera" | "layout" | "decoration" | "none";

export type LectureEffectDefinition<T extends LectureEffectType> = {
  schema: z.ZodMiniType<LectureEffectAction<T>>; // 파라미터 검증. 대본 전체 스키마와 같은 스키마다
  target: LectureEffectTarget<T>; // 노드를 가리키지 않는 동작은 null
  isPersistable: "persist" extends keyof LectureEffectAction<T> ? true : false; // persist: true로 다음 reset 전까지 유지할 수 있는지. 타입의 persist 필드와 어긋나면 타입 오류가 난다
  durationMeaning: DurationMeaning;
  motion: MotionKind;
};

/*
Record로 두어 동작 종류를 추가하고 등록을 빠뜨리면 타입 오류가 난다.
*/
export const LECTURE_ATOMIC_EFFECTS: {
  [T in LectureEffectType]: LectureEffectDefinition<T>;
} = {
  focus: {
    schema: lectureFocusActionSchema,
    target: { family: "node", field: "targetNodeIds" },
    isPersistable: false,
    durationMeaning: "effect",
    motion: "camera",
  },
  highlight: {
    schema: lectureHighlightActionSchema,
    target: { family: "node", field: "targetNodeIds" },
    isPersistable: true,
    durationMeaning: "effect",
    motion: "decoration",
  },
  dim: {
    schema: lectureDimActionSchema,
    target: { family: "node", field: "exceptNodeIds" },
    isPersistable: true,
    durationMeaning: "effect",
    motion: "decoration",
  },
  trace: {
    schema: lectureTraceActionSchema,
    target: { family: "node", field: "nodeIds" },
    isPersistable: true,
    durationMeaning: "effect",
    motion: "decoration",
  },
  badge: {
    schema: lectureBadgeActionSchema,
    target: { family: "node", field: "targetNodeIds" },
    isPersistable: true,
    durationMeaning: "effect",
    motion: "decoration", // 튀어나오는 등장은 CSS가 그리고, 동작 줄이기에서는 CSS가 끈다
  },
  wait: {
    schema: lectureWaitActionSchema,
    target: null,
    isPersistable: false,
    durationMeaning: "effect",
    motion: "none",
  },
  collapse: {
    schema: lectureCollapseActionSchema,
    target: { family: "node", field: "targetNodeIds" },
    isPersistable: false,
    durationMeaning: "hold",
    motion: "layout",
  },
  expand: {
    schema: lectureExpandActionSchema,
    target: { family: "node", field: "targetNodeIds" },
    isPersistable: false,
    durationMeaning: "hold",
    motion: "layout",
  },
  reset: {
    schema: lectureResetActionSchema,
    target: null,
    isPersistable: false,
    durationMeaning: "none",
    motion: "camera", // scope가 camera나 all이면 화면이 이동한다
  },
};

export const LECTURE_EFFECT_TYPES = Object.keys(
  LECTURE_ATOMIC_EFFECTS,
) as LectureEffectType[];

/*
함수 이름 : getLectureEffectNodeIdsField
기능 : 동작이 노드 ID 목록을 담는 필드 이름을 registry에서 찾는다.
인자 : LectureAnimationAction action -> 단위 동작
반환값 : 필드 이름. 노드를 가리키지 않는 동작이면 null
*/
export const getLectureEffectNodeIdsField = (
  action: LectureAnimationAction,
): LectureEffectNodeIdsField | null =>
  (
    LECTURE_ATOMIC_EFFECTS[action.type] as {
      target: { field: LectureEffectNodeIdsField } | null;
    }
  ).target?.field ?? null;

/*
함수 이름 : getLectureActionNodeIds
기능 : 동작이 가리키는 노드 ID 목록을 읽는다.
인자 : LectureAnimationAction action -> 단위 동작
반환값 : 노드 ID 목록. 노드를 가리키지 않는 동작이면 null
*/
export const getLectureActionNodeIds = (
  action: LectureAnimationAction,
): string[] | null => {
  const field = getLectureEffectNodeIdsField(action);

  /*
  registry의 field는 NodeIdsField 타입으로 이 동작의 string[] 필드만 가리킨다. 동작 종류와 필드를 한 번에 좁힐 수 없어 단언한다.
  */
  return field === null
    ? null
    : (action as unknown as Record<string, string[]>)[field];
};

/*
함수 이름 : getLectureActionWithNodeIds
기능 : 동작이 가리키는 노드 ID 목록을 바꾼 새 동작을 만든다.
인자 : A action -> 단위 동작
string[] nodeIds -> 새 노드 ID 목록
반환값 : 노드 목록이 바뀐 동작. 노드를 가리키지 않는 동작이면 그대로 돌려준다
*/
export const getLectureActionWithNodeIds = <A extends LectureAnimationAction>(
  action: A,
  nodeIds: string[],
): A => {
  const field = getLectureEffectNodeIdsField(action);

  return field === null ? action : { ...action, [field]: nodeIds };
};
