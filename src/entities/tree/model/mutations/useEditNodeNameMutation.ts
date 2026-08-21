import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { nodeApi } from "@/src/entities/tree/api/nodeApi";

interface EditNodeNameVariables {
  treeId: string; // 노드가 속한 트리 ID
  nodeId: string; // 제목을 수정할 노드 ID
  name: string; // 새로 저장할 노드 제목
}

/*
함수 이름 : useEditNodeNameMutation
기능 : 노드 제목 수정 API 요청을 수행하고, 서버가 반환한 노드로 트리 조회 캐시를 갱신한다. 노드 이름은 별도 캐시를 두지 않고 트리 조회 캐시에 얹혀 있는 값을 갱신한다.
인자 : 없음
반환값 : 노드 제목 수정 mutation 객체
*/
export const useEditNodeNameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treeId, nodeId, name }: EditNodeNameVariables) =>
      nodeApi.editNodeName(Number(treeId), Number(nodeId), { name }),

    /*
    서버가 제목을 보정할 수 있으므로 입력값이 아니라 응답으로 받은 노드를 캐시에 반영한다.
    */
    onSuccess: (updatedNode, { treeId }) => {
      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.id === updatedNode.id ? updatedNode : node,
          ),
      );
    },
  });
};
