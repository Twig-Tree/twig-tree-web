import {
  type LectureAnimation,
  type LectureAnimationAction,
} from "@/src/entities/lecture";

export type LabActionType = LectureAnimationAction["type"];

export type LabStep = {
  id: string; // 타임라인 안에서 단계를 구분하는 ID
  action: LectureAnimationAction; // 대본 계약 그대로의 단위 동작. 노드는 고정 트리의 서버 ID로 가리킨다
  withPrevious: boolean; // true이면 앞 단계와 동시에 시작한다
};

type LabJsonResult = { steps: LabStep[] } | { error: string };

let nextLabStepId = 0;

const createLabStepId = (): string => {
  nextLabStepId += 1;
  return `lab-step-${nextLabStepId}`;
};

/*
함수 이름 : createLabStep
기능 : 단위 동작으로 타임라인 단계를 만든다.
인자 : LectureAnimationAction action -> 단계가 실행할 동작
boolean withPrevious -> 앞 단계와 동시에 시작할지 여부
반환값 : 새 타임라인 단계
*/
export const createLabStep = (
  action: LectureAnimationAction,
  withPrevious = false,
): LabStep => ({ id: createLabStepId(), action, withPrevious });

/*
함수 이름 : createDefaultLabAction
기능 : 타임라인에 새로 추가할 동작의 기본값을 만든다.
인자 : LabActionType type -> 동작 종류
반환값 : 대상이 비어 있는 단위 동작
*/
export const createDefaultLabAction = (
  type: LabActionType,
): LectureAnimationAction => {
  switch (type) {
    case "focus":
      return { type, targetNodeIds: [], maxZoom: 1.3, durationMs: 800 };
    case "highlight":
      return {
        type,
        targetNodeIds: [],
        style: "pulse",
        tone: "accent",
        durationMs: 1200,
      };
    case "dim":
      return { type, exceptNodeIds: [], durationMs: 1200 };
    case "trace":
      return {
        type,
        nodeIds: [],
        mode: "progressive",
        direction: "forward",
        durationMs: 1600,
      };
    case "wait":
      return { type, durationMs: 800 };
    case "collapse":
    case "expand":
      return { type, targetNodeIds: [], durationMs: 1100 };
    case "reset":
      return { type, scope: "visual" };
  }
};

/*
함수 이름 : getLabActionNodeIds
기능 : 동작 종류마다 이름이 다른 대상 노드 목록을 읽는다.
인자 : LectureAnimationAction action -> 단위 동작
반환값 : 대상 노드 ID 목록. reset은 대상이 없어 null
*/
export const getLabActionNodeIds = (
  action: LectureAnimationAction,
): string[] | null => {
  switch (action.type) {
    case "focus":
    case "highlight":
    case "collapse":
    case "expand":
      return action.targetNodeIds;
    case "dim":
      return action.exceptNodeIds;
    case "trace":
      return action.nodeIds;
    case "reset":
    case "wait":
      return null;
  }
};

/*
함수 이름 : getLabActionWithNodeIds
기능 : 동작의 대상 노드 목록을 바꾼 새 동작을 만든다.
인자 : LectureAnimationAction action -> 단위 동작
string[] nodeIds -> 새 대상 노드 ID 목록
반환값 : 대상이 바뀐 단위 동작
*/
export const getLabActionWithNodeIds = (
  action: LectureAnimationAction,
  nodeIds: string[],
): LectureAnimationAction => {
  switch (action.type) {
    case "focus":
    case "highlight":
    case "collapse":
    case "expand":
      return { ...action, targetNodeIds: nodeIds };
    case "dim":
      return { ...action, exceptNodeIds: nodeIds };
    case "trace":
      return { ...action, nodeIds };
    case "reset":
    case "wait":
      return action;
  }
};

/*
함수 이름 : getLabAnimation
기능 : 타임라인을 대본 계약의 애니메이션으로 바꾼다. 동시에 시작하는 단계끼리 병렬 그룹으로 묶고, 그 묶음을 순서대로 잇는다.
인자 : LabStep[] steps -> 타임라인 단계 목록
반환값 : 대본의 beat.animation에 그대로 넣을 수 있는 애니메이션
*/
export const getLabAnimation = (steps: LabStep[]): LectureAnimation => {
  const batches: LectureAnimationAction[][] = [];

  for (const step of steps) {
    const lastBatch = batches.at(-1);

    if (step.withPrevious && lastBatch) lastBatch.push(step.action);
    else batches.push([step.action]);
  }

  const children: LectureAnimation[] = batches.map((batch) =>
    batch.length === 1
      ? batch[0]
      : { type: "group", mode: "parallel", children: batch },
  );

  return children.length === 1
    ? children[0]
    : { type: "group", mode: "sequence", children };
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isDuration = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/*
함수 이름 : isLectureAnimationAction
기능 : JSON에서 읽은 값이 대본 계약의 단위 동작 형식인지 판단한다.
인자 : Record<string, unknown> value -> 검사할 객체
반환값 : 단위 동작 형식이면 true
*/
const isLectureAnimationAction = (
  value: Record<string, unknown>,
): value is Record<string, unknown> & LectureAnimationAction => {
  const hasValidPersist =
    value.persist === undefined || typeof value.persist === "boolean";

  switch (value.type) {
    case "focus":
      return (
        isStringArray(value.targetNodeIds) &&
        typeof value.maxZoom === "number" &&
        value.maxZoom > 0 &&
        isDuration(value.durationMs)
      );
    case "highlight":
      return (
        isStringArray(value.targetNodeIds) &&
        (value.style === "steady" ||
          value.style === "pulse" ||
          value.style === "pop" ||
          value.style === "bounce" ||
          value.style === "shake") &&
        (value.tone === undefined ||
          value.tone === "accent" ||
          value.tone === "success" ||
          value.tone === "warning" ||
          value.tone === "danger") &&
        isDuration(value.durationMs) &&
        hasValidPersist
      );
    case "dim":
      return (
        isStringArray(value.exceptNodeIds) &&
        isDuration(value.durationMs) &&
        hasValidPersist
      );
    case "trace":
      return (
        isStringArray(value.nodeIds) &&
        isDuration(value.durationMs) &&
        (value.mode === undefined ||
          value.mode === "simultaneous" ||
          value.mode === "progressive") &&
        (value.direction === undefined ||
          value.direction === "forward" ||
          value.direction === "reverse") &&
        hasValidPersist
      );
    case "wait":
      return isDuration(value.durationMs);
    case "collapse":
    case "expand":
      return isStringArray(value.targetNodeIds) && isDuration(value.durationMs);
    case "reset":
      return (
        value.scope === "visual" ||
        value.scope === "camera" ||
        value.scope === "all"
      );
    default:
      return false;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/*
함수 이름 : getBatchFromJson
기능 : 순차 그룹의 자식 하나를 동시에 시작하는 동작 묶음으로 읽는다.
인자 : unknown value -> JSON에서 읽은 값
반환값 : 동작 묶음. 단위 동작이나 동작만 담은 병렬 그룹이 아니면 null
*/
const getBatchFromJson = (value: unknown): LectureAnimationAction[] | null => {
  if (!isRecord(value)) return null;
  if (isLectureAnimationAction(value)) return [value];
  if (value.type !== "group" || value.mode !== "parallel") return null;
  if (!Array.isArray(value.children)) return null;

  const actions = value.children.filter(
    (child): child is LectureAnimationAction =>
      isRecord(child) && isLectureAnimationAction(child),
  );

  return actions.length === value.children.length && actions.length > 0
    ? actions
    : null;
};

/*
함수 이름 : getLabStepsFromJson
기능 : 직접 고친 JSON을 타임라인 단계로 읽는다. 대본 계약은 그룹을 얼마든지 중첩할 수 있지만 타임라인은 "순차 안의 병렬"까지만 표현한다.
인자 : string text -> 애니메이션 JSON 문자열
반환값 : 읽은 단계 목록, 또는 화면에 보여줄 안내 문구
*/
export const getLabStepsFromJson = (text: string): LabJsonResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "JSON 문법이 올바르지 않습니다." };
  }

  const isSequence =
    isRecord(parsed) &&
    parsed.type === "group" &&
    parsed.mode === "sequence" &&
    Array.isArray(parsed.children);
  const items: unknown[] = isSequence
    ? (parsed as { children: unknown[] }).children
    : [parsed];

  if (items.length === 0) return { error: "실행할 동작이 없습니다." };

  const steps: LabStep[] = [];

  for (const item of items) {
    const batch = getBatchFromJson(item);

    if (batch === null) {
      return {
        error:
          "동작 형식이 틀렸거나, 타임라인이 표현할 수 없는 중첩입니다. 순차 그룹 안의 병렬 그룹까지만 읽습니다.",
      };
    }

    batch.forEach((action, index) => {
      steps.push(createLabStep(action, index > 0));
    });
  }

  return { steps };
};
