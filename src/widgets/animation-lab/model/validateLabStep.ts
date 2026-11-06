import { type LectureAnimationAction } from "@/src/entities/lecture";
import { type TreeNode } from "@/src/entities/tree";

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
