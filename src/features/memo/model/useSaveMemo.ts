import {
  useUpdateMemoMutation,
  useDeleteMemoMutation,
} from "@/src/entities/memo";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";

type UseSaveMemoParams = {
  treeId: string; // 메모가 속한 트리 ID
  nodeId: string | undefined; // 메모를 저장할 노드 ID, 선택된 노드가 없으면 undefined
  initialMemo: string; // 패널을 열었을 때 기준이 되는 기존 메모 내용
};

/*
함수 이름 : useSaveMemo
기능 : 메모 편집 화면의 저장 동작을 처리한다. 내용이 있으면 생성/수정 API를 호출하고, 내용이 비어 있는데 기존 메모가 있었다면 삭제 API를 호출한다. 기존에도 메모가 없었는데 빈 값으로 저장을 시도하면 API를 호출하지 않는다. 서버 저장이 끝나면 editor store의 노드 메모도 함께 갱신하고, 요청이 실패하면 사용자에게 알린다.
인자 : UseSaveMemoParams
반환값 : 메모 저장 핸들러와 저장 중 여부
*/
export const useSaveMemo = ({
  treeId,
  nodeId,
  initialMemo,
}: UseSaveMemoParams) => {
  const { mutateAsync: updateMemo, isPending: isUpdating } =
    useUpdateMemoMutation();
  const { mutateAsync: deleteMemo, isPending: isDeleting } =
    useDeleteMemoMutation();

  const updateNodeMemoInStore = useTreeStore(
    (state) => state.updateNodeMemoInStore,
  );

  const isSaving = isUpdating || isDeleting;

  const saveMemo = async (content: string) => {
    if (!nodeId || isSaving) return;

    const trimmedContent = content.trim();
    const hadMemoBefore = initialMemo.trim() !== "";

    try {
      if (trimmedContent === "") {
        if (!hadMemoBefore) return;

        await deleteMemo({ treeId, nodeId });
        updateNodeMemoInStore(nodeId, "");
        return;
      }

      await updateMemo({ treeId, nodeId, content });
      updateNodeMemoInStore(nodeId, content);
    } catch {
      alert("메모 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return {
    saveMemo,
    isSaving,
  };
};
