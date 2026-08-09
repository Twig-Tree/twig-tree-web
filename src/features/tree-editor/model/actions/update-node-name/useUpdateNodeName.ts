import { useCallback } from "react";
import { useEditNodeNameMutation } from "@/src/entities/node";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";
import { validateNodeName } from "@/src/features/tree-editor/lib/update-node-name/validateNodeName";

interface UseUpdateNodeNameParams {
  treeId: string; // 노드가 속한 트리 ID
  nodeId: string; // 제목을 수정할 노드 ID
}

/*
함수 이름 : useUpdateNodeName
기능 : 노드 제목을 optimistic update로 editor store에 반영하고 서버에 수정을 요청한다. 요청이 실패하면 이전 제목과 dirty 상태로 되돌린다.
인자 : UseUpdateNodeNameParams
반환값 : 제목 검증 함수, 제목 수정 핸들러, 수정 중 여부
*/
export const useUpdateNodeName = ({
  treeId,
  nodeId,
}: UseUpdateNodeNameParams) => {
  const updateNodeLabelInStore = useTreeStore(
    (state) => state.updateNodeLabelInStore,
  );

  const { mutateAsync: editNodeNameOnServer, isPending: isUpdatingNodeName } =
    useEditNodeNameMutation();

  const getNodeNameError = useCallback(
    (name: string) => validateNodeName(name),
    [],
  );

  /*
  입력값을 검증한 뒤 editor store에 먼저 반영하고 서버에 제목 수정을 요청한다.
  저장까지 성공하면 true, 검증 실패나 서버 오류면 false를 반환한다.
  사용자에게 보여줄 메시지는 호출부가 결정한다.
  */
  const updateNodeName = useCallback(
    async (name: string): Promise<boolean> => {
      if (isUpdatingNodeName) return false;

      const apiNodeId = Number(nodeId); // 서버에 저장되지 않은 임시 노드는 temp_ 접두사를 가져 숫자로 변환되지 않는다.
      if (!Number.isSafeInteger(apiNodeId) || apiNodeId <= 0) {
        alert(
          "아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.",
        );
        return false;
      }

      if (validateNodeName(name) !== null) return false;

      const trimmedName = name.trim();

      const previousLabel = useTreeStore
        .getState()
        .nodes.find((node) => node.id === nodeId)?.data.label;

      if (previousLabel === undefined) return false;

      if (previousLabel === trimmedName) return true; // 변경이 없으면 요청을 보내지 않는다.

      const wasDirtyBeforeUpdate = useTreeStore.getState().isDirty; // 실패 시 이전 dirty 상태로 복구하기 위해 저장한다.

      /*
      서버 응답을 기다리기 전에 editor store의 label을 먼저 교체한다.
      */
      updateNodeLabelInStore(nodeId, trimmedName);

      try {
        await editNodeNameOnServer({ treeId, nodeId, name: trimmedName });
        return true;
      } catch {
        /*
        label 변경은 zundo history에 기록되지 않아 undo()로 되돌릴 수 없다.
        보관해 둔 이전 label과 dirty 상태를 직접 복원한다.
        */
        updateNodeLabelInStore(nodeId, previousLabel);
        useTreeStore.setState({ isDirty: wasDirtyBeforeUpdate });
        return false;
      }
    },
    [
      editNodeNameOnServer,
      isUpdatingNodeName,
      nodeId,
      treeId,
      updateNodeLabelInStore,
    ],
  );

  return {
    getNodeNameError,
    updateNodeName,
    isUpdatingNodeName,
  };
};
