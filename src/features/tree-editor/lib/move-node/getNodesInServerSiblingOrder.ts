import { TreeNode } from "@/src/entities/tree";
import { CustomEditorNode } from "../../model/types";

/*
함수 이름 : getNodesInServerSiblingOrder
기능 : 서버가 확정한 형제 목록의 순서대로 editor store 노드의 orderIndex와 배열 순서를 맞춘다.
화면의 형제 순서는 배열 순서로 정해지므로, orderIndex만 맞추면 화면과 orderIndex가 서로 다른 순서를 가리키게 된다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
TreeNode[][] siblingGroups -> 서버가 돌려준 형제 목록들. 목록마다 한 부모의 자식 전체다
반환값 : 형제 순서를 맞춘 노드 배열. 바뀐 것이 없으면 입력 배열을 그대로 돌려준다
*/
export const getNodesInServerSiblingOrder = (
  nodes: CustomEditorNode[],
  siblingGroups: TreeNode[][],
): CustomEditorNode[] => {
  const nodeIndexByServerId = new Map(
    nodes.flatMap((node, index) =>
      node.data.serverId === null ? [] : [[node.data.serverId, index] as const],
    ),
  );

  const nextNodes = [...nodes];
  let hasChanged = false;

  siblingGroups.forEach((siblings) => {
    /*
    응답에만 있는 노드는 다른 탭에서 만든 노드다. editor store는 트리당 한 번만 채우므로 여기서 들이지 않는다.
    */
    const matchedSiblings = [...siblings]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .flatMap((sibling) => {
        const nodeIndex = nodeIndexByServerId.get(sibling.id);

        return nodeIndex === undefined
          ? []
          : [
              {
                node: nodes[nodeIndex],
                nodeIndex,
                orderIndex: sibling.orderIndex,
              },
            ];
      });

    /*
    형제들이 차지하던 배열 자리를 그대로 쓰고, 그 자리 안에서만 서버 순서로 다시 놓는다. 다른 노드의 자리는 움직이지 않는다.
    */
    const slots = matchedSiblings
      .map(({ nodeIndex }) => nodeIndex)
      .sort((a, b) => a - b);

    matchedSiblings.forEach(({ node, orderIndex }, index) => {
      const slot = slots[index];
      const nextNode =
        node.data.orderIndex === orderIndex
          ? node
          : { ...node, data: { ...node.data, orderIndex } };

      if (nextNode !== nodes[slot]) hasChanged = true;

      nextNodes[slot] = nextNode;
    });
  });

  return hasChanged ? nextNodes : nodes;
};
