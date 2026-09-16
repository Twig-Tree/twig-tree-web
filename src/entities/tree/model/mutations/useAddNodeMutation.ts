import { treeApi } from "@/src/entities/tree/api/treeApi";
import { CreateNodeRequest } from "@/src/entities/tree/api/types";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddNodeVariables {
  treeId: string; // 노드를 추가할 트리 ID
  node: {
    name: string;
    parentId: string | null; // 루트 노드는 null
    orderId: number;
  };
}

/*
함수 이름 : useAddNodeMutation
기능 : 노드 추가 API 요청을 수행하고, 서버가 확정한 노드를 트리 조회 캐시에 반영한다.
인자 : 없음
반환값 : 노드 추가 mutation 객체
*/
export const useAddNodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treeId, node }: AddNodeVariables) => {
      /*
      Number(null)은 0이므로 null 확인이 숫자 변환보다 먼저다. 순서가 뒤집히면 루트 생성이 parentId=0으로 나간다.
      */
      const request: CreateNodeRequest = {
        ...node,
        parentId: node.parentId === null ? null : Number(node.parentId),
      };

      return treeApi.createNode(Number(treeId), request);
    },

    /*
    화면의 즉시 반영은 editor store가 담당하므로 캐시에는 추측 노드를 넣지 않는다.
    캐시는 배열 순서를 약속하지 않으므로 서버가 준 노드를 끝에 덧붙인다.
    */
    onSuccess: (createdNode, { treeId }) => {
      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) => (oldNodes ? [...oldNodes, createdNode] : oldNodes),
      );
    },
  });
};
