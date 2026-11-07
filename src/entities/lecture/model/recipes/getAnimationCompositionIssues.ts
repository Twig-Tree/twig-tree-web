import { LECTURE_ATOMIC_EFFECTS } from "../atomicEffects";
import {
  type LectureAnimation,
  type LectureAnimationAction,
  type LectureAnimationGroup,
} from "../types";
import { type LectureRecipeIssue } from "./types";

/*
recipe가 만든 애니메이션, 또는 여러 recipe를 이어 붙인 애니메이션이 함께 실행될 수 있는지 검사한다.
대본 스키마는 동작 하나하나의 모양만 보므로, 동작 사이의 관계는 여기서 본다.

- 병렬 묶음 안에서 둘 이상의 갈래가 카메라를 움직이면 마지막 이동만 남고 앞의 이동이 끊긴다.
- 병렬 묶음 안에서 둘 이상의 갈래가 같은 노드를 접거나 펼치면 결과가 실행 순서에 따라 달라진다.
- persist 효과는 reset 전까지 남는다. 장면 안에서 다음 비트까지 남기는 것은 의도이므로(continuity: persist)
  부르는 쪽이 끝까지 남아도 되는지 정한다.
- 서로 다른 노드를 남기는 persist 흐림이 함께 남으면, 각 흐림이 다른 흐림의 대상을 흐려 결국 모든 노드가 흐려진다.

persist와 reset은 적힌 순서가 아니라 실행 시각 순서로 따라간다. 병렬 갈래는 같은 시각에 시작하므로,
parallel(sequence(wait, persist 강조), reset)에서는 reset이 먼저 실행되고 강조가 남는다.
*/

type GetAnimationCompositionIssuesOptions = {
  allowLingeringPersist: boolean; // true면 끝날 때 reset 없이 남은 persist 효과를 문제로 보지 않는다
};

type IndexedAction = {
  action: LectureAnimationAction;
  path: PropertyKey[]; // 애니메이션 안의 위치. 그룹은 children과 순번으로 내려간다
};

/*
함수 이름 : getIndexedActions
기능 : 애니메이션 안의 모든 단위 동작을 실행 순서대로 위치와 함께 꺼낸다. 병렬 그룹은 적힌 순서를 따른다.
인자 : LectureAnimation animation -> 애니메이션
PropertyKey[] path -> animation의 위치
반환값 : 위치가 붙은 단위 동작 목록
*/
const getIndexedActions = (
  animation: LectureAnimation,
  path: PropertyKey[],
): IndexedAction[] =>
  animation.type === "group"
    ? animation.children.flatMap((child, index) =>
        getIndexedActions(child, [...path, "children", index]),
      )
    : [{ action: animation, path }];

type TimedAction = IndexedAction & {
  startMs: number; // 애니메이션 시작부터 이 동작이 시작하기까지의 시간
};

/*
함수 이름 : getAnimationDurationMs
기능 : 애니메이션이 끝나기까지의 시간을 구한다. 순차 그룹은 자식 시간을 더하고, 병렬 그룹은 가장 긴 자식을 기다린다.
인자 : LectureAnimation animation -> 애니메이션
반환값 : 걸리는 시간(ms). reset처럼 시간이 없는 동작은 0
*/
const getAnimationDurationMs = (animation: LectureAnimation): number => {
  if (animation.type !== "group") {
    return "durationMs" in animation ? animation.durationMs : 0;
  }

  const childDurations = animation.children.map(getAnimationDurationMs);

  return animation.mode === "sequence"
    ? childDurations.reduce((sum, duration) => sum + duration, 0)
    : Math.max(0, ...childDurations);
};

/*
함수 이름 : getTimedActions
기능 : 애니메이션 안의 모든 단위 동작을 시작 시각 순서로 꺼낸다. 같은 시각이면 적힌 순서를 따른다.
실행기가 병렬 갈래를 적힌 순서대로 동시에 시작하므로, 같은 시각의 동작도 그 순서로 적용된다.
인자 : LectureAnimation animation -> 애니메이션
반환값 : 시작 시각과 위치가 붙은 단위 동작 목록
*/
const getTimedActions = (animation: LectureAnimation): TimedAction[] => {
  const timedActions: TimedAction[] = [];

  const collect = (
    current: LectureAnimation,
    startMs: number,
    path: PropertyKey[],
  ) => {
    if (current.type !== "group") {
      timedActions.push({ action: current, path, startMs });
      return;
    }

    let childStartMs = startMs;

    current.children.forEach((child, index) => {
      collect(child, childStartMs, [...path, "children", index]);
      if (current.mode === "sequence") {
        childStartMs += getAnimationDurationMs(child);
      }
    });
  };

  collect(animation, 0, []);

  return timedActions
    .map((timed, order) => ({ timed, order }))
    .sort((a, b) => a.timed.startMs - b.timed.startMs || a.order - b.order)
    .map(({ timed }) => timed);
};

const isVisualReset = (action: LectureAnimationAction): boolean =>
  action.type === "reset" && action.scope !== "camera";

const isPersistent = (action: LectureAnimationAction): boolean =>
  "persist" in action && action.persist === true;

const isCameraAction = (action: LectureAnimationAction): boolean =>
  action.type === "reset"
    ? action.scope !== "visual"
    : LECTURE_ATOMIC_EFFECTS[action.type].motion === "camera";

const getLayoutNodeIds = (action: LectureAnimationAction): string[] =>
  action.type === "collapse" || action.type === "expand"
    ? action.targetNodeIds
    : [];

/*
함수 이름 : getParallelIssues
기능 : 병렬 그룹 하나에서 갈래끼리 카메라나 같은 노드의 배치를 함께 바꾸는지 검사한다.
인자 : LectureAnimationGroup group -> 병렬 그룹
PropertyKey[] path -> 그룹의 위치
반환값 : 문제 목록
*/
const getParallelIssues = (
  group: LectureAnimationGroup,
  path: PropertyKey[],
): LectureRecipeIssue[] => {
  const branches = group.children.map((child, index) =>
    getIndexedActions(child, [...path, "children", index]),
  );
  const issues: LectureRecipeIssue[] = [];

  const cameraBranches = branches.filter((actions) =>
    actions.some(({ action }) => isCameraAction(action)),
  );

  if (cameraBranches.length > 1) {
    issues.push({
      path,
      message: "병렬 묶음에서 둘 이상의 갈래가 카메라를 움직입니다.",
    });
  }

  const layoutOwnerByNodeId = new Map<string, number>();

  branches.forEach((actions, branchIndex) => {
    for (const { action, path: actionPath } of actions) {
      for (const nodeId of getLayoutNodeIds(action)) {
        const ownerIndex = layoutOwnerByNodeId.get(nodeId);

        if (ownerIndex !== undefined && ownerIndex !== branchIndex) {
          issues.push({
            path: actionPath,
            message: `병렬 묶음에서 다른 갈래와 같은 노드(${nodeId})를 접거나 펼칩니다.`,
          });
        }

        layoutOwnerByNodeId.set(nodeId, branchIndex);
      }
    }
  });

  return issues;
};

/*
함수 이름 : getGroupIssues
기능 : 애니메이션 안의 모든 병렬 그룹을 찾아 검사한다.
인자 : LectureAnimation animation -> 애니메이션
PropertyKey[] path -> animation의 위치
반환값 : 문제 목록
*/
const getGroupIssues = (
  animation: LectureAnimation,
  path: PropertyKey[],
): LectureRecipeIssue[] => {
  if (animation.type !== "group") return [];

  return [
    ...(animation.mode === "parallel"
      ? getParallelIssues(animation, path)
      : []),
    ...animation.children.flatMap((child, index) =>
      getGroupIssues(child, [...path, "children", index]),
    ),
  ];
};

/*
함수 이름 : getLingeringPersistIssues
기능 : 실행 시각 순서로 따라가며 끝날 때까지 reset으로 지워지지 않는 persist 효과를 찾는다.
reset은 scope가 visual이나 all일 때 효과를 지운다.
인자 : TimedAction[] timedActions -> 시작 시각 순서의 단위 동작
반환값 : 남은 persist 동작마다 문제 하나
*/
const getLingeringPersistIssues = (
  timedActions: TimedAction[],
): LectureRecipeIssue[] => {
  let lingering: TimedAction[] = [];

  for (const timed of timedActions) {
    if (isVisualReset(timed.action)) lingering = [];
    else if (isPersistent(timed.action)) lingering.push(timed);
  }

  return lingering.map(({ path }) => ({
    path,
    message: "reset 없이 끝까지 남는 persist 효과입니다.",
  }));
};

const isSameNodeSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((nodeId) => b.includes(nodeId));

/*
함수 이름 : getConflictingPersistDimIssues
기능 : 실행 시각 순서로 따라가며, 남아 있는 persist 흐림과 다른 노드를 남기는 persist 흐림이 더해지는지 찾는다.
인자 : TimedAction[] timedActions -> 시작 시각 순서의 단위 동작
반환값 : 충돌하는 흐림마다 문제 하나
*/
const getConflictingPersistDimIssues = (
  timedActions: TimedAction[],
): LectureRecipeIssue[] => {
  const issues: LectureRecipeIssue[] = [];
  let activeExceptNodeIds: string[][] = [];

  for (const { action, path } of timedActions) {
    if (isVisualReset(action)) {
      activeExceptNodeIds = [];
      continue;
    }

    if (action.type !== "dim" || !isPersistent(action)) continue;

    if (
      activeExceptNodeIds.some(
        (exceptNodeIds) => !isSameNodeSet(exceptNodeIds, action.exceptNodeIds),
      )
    ) {
      issues.push({
        path,
        message:
          "남아 있는 persist 흐림과 다른 노드를 남기는 persist 흐림이 겹쳐, 남겨야 할 노드까지 흐려집니다.",
      });
    }

    activeExceptNodeIds.push(action.exceptNodeIds);
  }

  return issues;
};

/*
함수 이름 : getAnimationCompositionIssues
기능 : 애니메이션의 동작들이 함께 실행될 수 있는지 검사한다.
인자 : LectureAnimation animation -> 검사할 애니메이션
GetAnimationCompositionIssuesOptions options -> 끝까지 남는 persist를 허용할지. 흐림 충돌은 허용과 관계없이 검사한다
반환값 : 애니메이션 안의 위치별 문제 목록. 없으면 빈 목록
*/
export const getAnimationCompositionIssues = (
  animation: LectureAnimation,
  { allowLingeringPersist }: GetAnimationCompositionIssuesOptions,
): LectureRecipeIssue[] => {
  const timedActions = getTimedActions(animation);

  return [
    ...getGroupIssues(animation, []),
    ...getConflictingPersistDimIssues(timedActions),
    ...(allowLingeringPersist ? [] : getLingeringPersistIssues(timedActions)),
  ];
};
