import { useMutation } from "@tanstack/react-query";
import { type DemoTreeNode } from "@/src/entities/lecture";
import { useAddNodeMutation } from "@/src/entities/tree";
import {
  useCreateWorkspaceMutation,
  useCreateWorkspaceTreeMutation,
} from "@/src/entities/workspace";

const FIRST_ORDER_ID = 1; // 백엔드가 orderId를 1 이상으로 받는다

/*
함수 이름 : useCreateDemoTree
기능 : 데모 트리 원본으로 루트 폴더에 워크스페이스, 트리, 노드를 차례로 만든다.
인자 : 없음
반환값 : 데모 트리 생성 mutation. 성공 데이터는 만든 워크스페이스 ID

자식을 만들려면 부모의 서버 ID가 필요하므로 노드를 위에서 아래로 하나씩 만든다.
중간에 실패해도 되돌리지 않는다. 개발용 화면이라 남은 워크스페이스는 사용자가 지우고 다시 만든다.
*/
export function useCreateDemoTree() {
  const { mutateAsync: createWorkspace } = useCreateWorkspaceMutation();
  const { mutateAsync: createWorkspaceTree } = useCreateWorkspaceTreeMutation();
  const { mutateAsync: addNode } = useAddNodeMutation();

  const createNodeWithChildren = async (
    treeId: string,
    node: DemoTreeNode,
    parentId: string | null,
    orderId: number,
  ) => {
    const createdNode = await addNode({
      treeId,
      node: { name: node.name, parentId, orderId },
    });

    for (const [index, child] of (node.children ?? []).entries()) {
      await createNodeWithChildren(
        treeId,
        child,
        createdNode.id,
        FIRST_ORDER_ID + index,
      );
    }
  };

  return useMutation({
    mutationFn: async (tree: DemoTreeNode) => {
      const workspace = await createWorkspace({
        name: tree.name,
        folderId: null,
      });
      const treeId = await createWorkspaceTree(workspace.id);

      await createNodeWithChildren(treeId, tree, null, FIRST_ORDER_ID);

      return workspace.id;
    },
  });
}
