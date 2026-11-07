import {
  type LectureAnimation,
  type LectureAnimationAction,
  lectureAnimationActionSchema,
} from "@/src/entities/lecture";
import { LAB_ACTIONS } from "./labActions";

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
): LectureAnimationAction => LAB_ACTIONS[type].createDefault();

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/*
함수 이름 : getActionFromJson
기능 : JSON에서 읽은 값을 대본 스키마로 검사해 단위 동작으로 읽는다.
인자 : unknown value -> JSON에서 읽은 값
반환값 : 단위 동작. 형식이 틀리면 null
*/
const getActionFromJson = (value: unknown): LectureAnimationAction | null => {
  const result = lectureAnimationActionSchema.safeParse(value);

  return result.success ? result.data : null;
};

/*
함수 이름 : getBatchFromJson
기능 : 순차 그룹의 자식 하나를 동시에 시작하는 동작 묶음으로 읽는다.
인자 : unknown value -> JSON에서 읽은 값
반환값 : 동작 묶음. 단위 동작이나 동작만 담은 병렬 그룹이 아니면 null
*/
const getBatchFromJson = (value: unknown): LectureAnimationAction[] | null => {
  if (!isRecord(value)) return null;

  const action = getActionFromJson(value);
  if (action !== null) return [action];

  if (value.type !== "group" || value.mode !== "parallel") return null;
  if (!Array.isArray(value.children) || value.children.length === 0) {
    return null;
  }

  const actions = value.children.map(getActionFromJson);

  return actions.includes(null)
    ? null
    : actions.filter((child) => child !== null);
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
