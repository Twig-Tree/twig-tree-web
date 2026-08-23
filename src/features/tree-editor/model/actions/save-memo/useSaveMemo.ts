import {
  useUpdateMemoMutation,
  useDeleteMemoMutation,
} from "@/src/entities/tree";
import { useTreeStore } from "../../treeStore";

type UseSaveMemoParams = {
  treeId: string; // 메모가 속한 트리 ID
  nodeId: string | undefined; // 메모를 저장할 editor store의 노드 ID, 선택된 노드가 없으면 undefined
  serverId: string | null; // 같은 노드의 서버 ID, 아직 저장 전이거나 선택된 노드가 없으면 null
  savedMemo: string | null; // 현재 저장되어 있는 메모, 메모가 없으면 null
};

/*
함수 이름 : useSaveMemo
기능 : 메모 편집 화면의 저장 동작을 처리한다. 내용이 있으면 생성/수정 API를 호출하고, 내용이 비어 있는데 저장된 메모가 있었다면 삭제 API를 호출한다. 저장된 메모가 없는데 빈 값으로 저장을 시도하면 API를 호출하지 않고, 노드가 아직 서버에 저장되지 않았다면 요청을 보내지 않고 사용자에게 알린다. 서버 저장이 끝나면 editor store의 노드 메모도 함께 갱신하고, 요청이 실패하면 사용자에게 알린다.
인자 : UseSaveMemoParams
반환값 : 메모 저장 핸들러와 저장 중 여부
*/
export const useSaveMemo = ({
  treeId,
  nodeId,
  serverId,
  savedMemo,
}: UseSaveMemoParams) => {
  const { mutateAsync: updateMemo, isPending: isUpdating } =
    useUpdateMemoMutation();
  const { mutateAsync: deleteMemo, isPending: isDeleting } =
    useDeleteMemoMutation();

  const updateNodeMemoInStore = useTreeStore(
    (state) => state.updateNodeMemoInStore,
  );

  const isSaving = isUpdating || isDeleting;

  const handleSaveMemo = async (content: string) => {
    if (!nodeId || isSaving) return;

    const trimmedContent = content.trim();

    /*
    백엔드는 빈 메모를 저장하지 않으므로, 빈 내용 저장은 메모 삭제로 처리한다.
    저장된 메모가 없으면 지울 것도 없어 요청을 보내지 않는다.
    */
    const shouldDeleteMemo = trimmedContent === "";

    if (shouldDeleteMemo && savedMemo === null) return;

    /*
    메모 API는 노드의 서버 ID로 대상을 지정하므로 아직 저장되지 않은 노드에는 보낼 수 없다.
    가드가 없으면 서버가 모르는 ID가 그대로 요청에 실린다.
    보낼 요청이 없는 경우를 먼저 걸러야 새 노드에서 빈 메모를 저장할 때 불필요한 알림이 뜨지 않는다.
    */
    if (serverId === null) {
      alert("아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      if (shouldDeleteMemo) {
        await deleteMemo({ treeId, nodeId: serverId });
        updateNodeMemoInStore(nodeId, null);
        return;
      }

      const updatedMemo = await updateMemo({
        treeId,
        nodeId: serverId,
        content: trimmedContent,
      });

      updateNodeMemoInStore(nodeId, updatedMemo.content); // 서버가 보정한 값을 화면에도 반영한다.
    } catch {
      alert("메모 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return {
    handleSaveMemo,
    isSaving,
  };
};
