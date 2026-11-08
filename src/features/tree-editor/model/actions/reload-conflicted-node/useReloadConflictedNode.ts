import { useCallback } from "react";
import { NODE_ERROR_CODE, useFetchLatestNode } from "@/src/entities/tree";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { useExternalChangeCheckStore } from "../../sync/externalChangeCheckStore";
import { useTreeStore } from "../../treeStore";

type ReloadConflictedNodeParams = {
  treeId: string; // 노드가 속한 트리 ID
  clientId: string; // 저장이 충돌한 노드의 편집기 노드 ID
  serverId: string; // 같은 노드의 서버 ID
};

/*
함수 이름 : useReloadConflictedNode
기능 : version 충돌로 저장이 거절된 노드의 최신 값을 서버에서 읽어 editor store에 반영하는 함수를 만든다. 반영하지 않으면 같은 입력을 다시 저장해도 계속 충돌한다.
인자 : 없음
반환값 : ReloadConflictedNodeParams를 받아 최신 값을 반영하는 함수

노드가 그 사이 지워졌으면 호출부가 안내할 수 있도록 오류를 그대로 던진다. 그 밖의 조회 실패는 충돌 안내를 막을 이유가 없어 삼킨다.
이때 version이 그대로이므로 다시 저장하면 또 충돌하고, 그때 다시 읽는다.
*/
export const useReloadConflictedNode = () => {
  const fetchLatestNode = useFetchLatestNode();
  const applyLatestNodeInStore = useTreeStore(
    (state) => state.applyLatestNodeInStore,
  );

  return useCallback(
    async ({ treeId, clientId, serverId }: ReloadConflictedNodeParams) => {
      useExternalChangeCheckStore.getState().requestExternalChangeCheck(); // 이 노드 말고도 바뀐 것이 있을 수 있어 트리 전체를 확인한다.

      try {
        const latestNode = await fetchLatestNode({ treeId, nodeId: serverId });

        applyLatestNodeInStore(clientId, latestNode);
      } catch (error) {
        if (getApiErrorCode(error) === NODE_ERROR_CODE.NODE_NOT_FOUND) {
          throw error;
        }
      }
    },
    [applyLatestNodeInStore, fetchLatestNode],
  );
};
