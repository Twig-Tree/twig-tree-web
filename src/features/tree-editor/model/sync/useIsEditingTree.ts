import { useIsMutating } from "@tanstack/react-query";
import { treeQueryKeys } from "@/src/entities/tree";
import { useTreeStore } from "../treeStore";
import { useEditingStore } from "./editingStore";

type UseIsEditingTreeParams = {
  isStructureEditing: boolean; // 페이지의 구조 편집 잠금 값. 노드 추가·삭제·이동과 undo/redo가 진행 중인지
};

/*
함수 이름 : useIsEditingTree
기능 : 지금 store를 서버 값으로 바꾸면 사용자의 작업이 사라지거나 어긋나는 상태인지 판단한다. 이름 입력 중, 저장하지 않은 메모가 있을 때, 트리 저장 요청 중, 노드를 끄는 중이면 편집 중이다.
인자 : UseIsEditingTreeParams
반환값 : 편집 중이면 true

undo/redo는 요청을 순서대로 여러 번 보내 요청 사이에 mutation이 0개인 순간이 있다. 그래서 mutation 수만 보지 않고 페이지의 잠금 값을 함께 본다.
*/
export const useIsEditingTree = ({
  isStructureEditing,
}: UseIsEditingTreeParams): boolean => {
  const isEditingNodeName = useEditingStore(
    (state) => state.nameEditingClientIds.size > 0,
  );
  const isMemoDirty = useEditingStore((state) => state.isMemoDirty);
  const isDraggingNode = useTreeStore((state) =>
    state.nodes.some((node) => node.dragging),
  );
  const treeMutationCount = useIsMutating({
    mutationKey: treeQueryKeys.mutations(),
  });

  return (
    isEditingNodeName ||
    isMemoDirty ||
    isDraggingNode ||
    isStructureEditing ||
    treeMutationCount > 0
  );
};
