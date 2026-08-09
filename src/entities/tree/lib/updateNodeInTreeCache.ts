import { QueryClient } from "@tanstack/react-query";
import { NodeDTO } from "@/src/entities/tree/api/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

/*
함수 이름 : updateNodeInTreeCache
기능 : 트리 조회 캐시에서 특정 노드를 찾아 전달받은 필드만 병합한다. 트리 조회 캐시는 entities/tree가 소유하므로, 다른 slice가 노드 속성을 바꿀 때 캐시 형태를 알지 않아도 되도록 갱신 방법을 이 함수로 공개한다.
인자 : QueryClient queryClient -> 캐시를 갱신할 query client
string treeId -> 노드가 속한 트리 ID
string nodeId -> 갱신할 노드 ID
Partial<NodeDTO> patch -> 병합할 필드
반환값 : 없음
*/
export const updateNodeInTreeCache = (
  queryClient: QueryClient,
  treeId: string,
  nodeId: string,
  patch: Partial<NodeDTO>,
) => {
  const apiNodeId = Number(nodeId); // 캐시가 백엔드 DTO를 담고 있어 비교를 위해 숫자로 변환한다.

  queryClient.setQueryData<NodeDTO[]>(
    treeQueryKeys.detail(treeId),
    (oldNodes) =>
      oldNodes?.map((node) =>
        node.nodeId === apiNodeId ? { ...node, ...patch } : node,
      ),
  );
};
