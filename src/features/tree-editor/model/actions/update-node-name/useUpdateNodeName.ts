import { useCallback } from "react";
import { NODE_ERROR_CODE, useEditNodeNameMutation } from "@/src/entities/tree";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";
import { validateNodeName } from "@/src/features/tree-editor/lib/update-node-name/validateNodeName";
import { runNodeSaveInOrder } from "@/src/features/tree-editor/lib/runNodeSaveInOrder";
import { useReloadConflictedNode } from "../reload-conflicted-node/useReloadConflictedNode";
import { useExternalChangeCheckStore } from "../../sync/externalChangeCheckStore";

interface UseUpdateNodeNameParams {
  treeId: string; // 노드가 속한 트리 ID
  clientId: string; // 제목을 수정할 노드의 편집기 노드 ID
  serverId: string | null; // 같은 노드의 서버 ID, 아직 저장 전이면 null
}

export type UpdateNodeNameResult =
  | "saved" // 저장했거나 바꿀 내용이 없다
  | "conflict" // 다른 곳에서 먼저 수정되어 저장하지 않았다. 최신 값은 store에 반영했다
  | "notFound" // 다른 곳에서 노드가 삭제되었다
  | "failed"; // 검증 실패나 그 밖의 서버 오류

/*
함수 이름 : useUpdateNodeName
기능 : 노드 제목을 optimistic update로 editor store에 반영하고 서버에 수정을 요청한다. 요청이 실패하면 이전 제목으로 되돌리고, version 충돌이면 최신 값을 store에 반영한다.
인자 : UseUpdateNodeNameParams
반환값 : 제목 검증 함수, 제목 수정 핸들러, 수정 중 여부
*/
export const useUpdateNodeName = ({
  treeId,
  clientId,
  serverId,
}: UseUpdateNodeNameParams) => {
  const updateNodeLabelInStore = useTreeStore(
    (state) => state.updateNodeLabelInStore,
  );
  const updateNodeVersionInStore = useTreeStore(
    (state) => state.updateNodeVersionInStore,
  );

  const reloadConflictedNode = useReloadConflictedNode();

  const { mutateAsync: editNodeNameOnServer, isPending: isUpdatingNodeName } =
    useEditNodeNameMutation();

  const getNodeNameError = useCallback(
    (name: string) => validateNodeName(name),
    [],
  );

  /*
  입력값을 검증한 뒤 editor store에 먼저 반영하고 서버에 제목 수정을 요청한다.
  저장 결과를 돌려주고, 사용자에게 보여줄 메시지는 호출부가 결정한다.
  */
  const updateNodeName = useCallback(
    async (name: string): Promise<UpdateNodeNameResult> => {
      if (isUpdatingNodeName) return "failed";

      if (serverId === null) {
        alert(
          "아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.",
        );
        return "failed";
      }

      if (validateNodeName(name) !== null) return "failed";

      const trimmedName = name.trim();

      const previousLabel = useTreeStore
        .getState()
        .nodes.find((node) => node.id === clientId)?.data.label;

      if (previousLabel === undefined) return "failed";

      if (previousLabel === trimmedName) return "saved"; // 변경이 없으면 요청을 보내지 않는다.

      /*
      서버 응답을 기다리기 전에 editor store의 label을 먼저 교체한다.
      */
      updateNodeLabelInStore(clientId, trimmedName);

      try {
        /*
        version은 차례가 되었을 때 읽는다. 먼저 읽으면 앞서 맡긴 같은 노드의 저장이 올린 값을 놓친다.
        */
        const updatedNode = await runNodeSaveInOrder(clientId, async () => {
          const node = useTreeStore
            .getState()
            .nodes.find(({ id }) => id === clientId);

          if (!node) throw new Error("저장할 노드가 편집기에 없습니다.");

          try {
            return await editNodeNameOnServer({
              treeId,
              nodeId: serverId,
              name: trimmedName,
              version: node.data.version,
            });
          } catch (error) {
            if (getApiErrorCode(error) !== NODE_ERROR_CODE.VERSION_CONFLICT) {
              throw error;
            }

            /*
            같은 노드의 다음 저장이 최신 version을 읽도록 이 차례 안에서 다시 읽는다.
            조회가 실패해도 낙관적으로 넣은 제목이 남지 않게 먼저 되돌린다.
            */
            updateNodeLabelInStore(clientId, previousLabel);
            await reloadConflictedNode({ treeId, clientId, serverId });

            return null;
          }
        });

        if (updatedNode === null) return "conflict";

        /*
        서버가 제목을 보정할 수 있으므로 query cache와 같은 값을 store에도 반영한다.
        보내지 않으면 cache는 서버 값, 화면은 입력값으로 갈린다.
        */
        updateNodeLabelInStore(clientId, updatedNode.label);
        updateNodeVersionInStore(clientId, updatedNode.version);

        return "saved";
      } catch (error) {
        /*
        보관해 둔 이전 label을 직접 복원한다.
        */
        updateNodeLabelInStore(clientId, previousLabel);

        if (getApiErrorCode(error) !== NODE_ERROR_CODE.NODE_NOT_FOUND) {
          return "failed";
        }

        useExternalChangeCheckStore.getState().requestExternalChangeCheck(); // 노드가 사라졌으니 화면도 맞춘다.

        return "notFound";
      }
    },
    [
      editNodeNameOnServer,
      isUpdatingNodeName,
      clientId,
      reloadConflictedNode,
      serverId,
      treeId,
      updateNodeLabelInStore,
      updateNodeVersionInStore,
    ],
  );

  return {
    getNodeNameError,
    updateNodeName,
    isUpdatingNodeName,
  };
};
