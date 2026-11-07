import { type LectureAnimationAction } from "@/src/entities/lecture";
import { type TreeNode } from "@/src/entities/tree";
import { type LabStep } from "./labTimeline";

/*
함수 이름 : validateLabAction
기능 : 재생해도 화면에 아무 변화가 없거나 실패할 동작을 찾아 이유를 알려 준다.
인자 : LectureAnimationAction action -> 검사할 단위 동작
TreeNode[] tree -> 대상 노드를 찾을 고정 트리
반환값 : 안내 문구. 문제가 없으면 null
*/
export const validateLabAction = (
  action: LectureAnimationAction,
  tree: TreeNode[],
): string | null => {
  const parentIdById = new Map(tree.map((node) => [node.id, node.parentId]));

  const hasUnknownNode = (nodeIds: string[]) =>
    nodeIds.some((nodeId) => !parentIdById.has(nodeId));

  switch (action.type) {
    case "focus":
    case "highlight":
      if (
        action.type === "focus" &&
        !(Number.isFinite(action.maxZoom) && action.maxZoom > 0)
      ) {
        return "최대 배율은 0보다 커야 합니다.";
      }
      if (action.targetNodeIds.length === 0) return "대상 노드를 고르세요.";
      if (hasUnknownNode(action.targetNodeIds)) {
        return "트리에 없는 노드가 있습니다.";
      }
      return null;
    case "dim":
      return hasUnknownNode(action.exceptNodeIds)
        ? "트리에 없는 노드가 있습니다."
        : null;
    case "trace":
      if (action.nodeIds.length < 2) {
        return "부모부터 자식 순서로 노드를 2개 이상 고르세요.";
      }
      if (hasUnknownNode(action.nodeIds)) return "트리에 없는 노드가 있습니다.";

      /*
      연결선 추적은 부모에서 자식으로 이어지는 엣지만 강조하므로, 끊긴 구간은 재생해도 보이지 않는다.
      */
      return action.nodeIds
        .slice(1)
        .every(
          (nodeId, index) => parentIdById.get(nodeId) === action.nodeIds[index],
        )
        ? null
        : "연결되지 않은 구간이 있어 일부 연결선이 보이지 않습니다. 부모에서 자식 순서로 고르세요.";
    case "collapse":
    case "expand":
      if (action.targetNodeIds.length === 0) return "대상 노드를 고르세요.";
      if (hasUnknownNode(action.targetNodeIds)) {
        return "트리에 없는 노드가 있습니다.";
      }

      return action.targetNodeIds.every((nodeId) =>
        tree.some((node) => node.parentId === nodeId),
      )
        ? null
        : "자식이 없는 노드는 접거나 펼쳐도 보이는 변화가 없습니다.";
    case "reset":
    case "wait":
      return null;
  }
};

/*
함수 이름 : isLabTimelinePlayable
기능 : 타임라인을 재생해도 되는지 판단한다. 빈 대상으로 재생하면 실패한 것처럼 보이므로 막는다.
연결선 경고는 일부라도 보이지만, 끊긴 경로는 고쳐야 할 입력이라 함께 막는다.
인자 : LabStep[] steps -> 타임라인 단계
TreeNode[] tree -> 대상 노드를 찾을 고정 트리
반환값 : 단계가 하나 이상이고 모든 단계에 문제가 없으면 true
*/
export const isLabTimelinePlayable = (
  steps: LabStep[],
  tree: TreeNode[],
): boolean =>
  steps.length > 0 &&
  steps.every((step) => validateLabAction(step.action, tree) === null);
