import { useCallback, useMemo } from "react";
import {
  NODE_ACTION_IDS,
  type NodeActionId,
} from "../../lib/shortcuts/nodeActionShortcuts";
import { getNodeActionBlockReason } from "../../lib/node-action/getNodeActionBlockReason";
import { useIsLectureActive } from "../lecture/lectureStore";
import { useEditingStore } from "../sync/editingStore";
import { useTreeStore } from "../treeStore";

type UseNodeActionsParams = {
  isMutating: boolean; // 노드 추가·삭제·이동이나 undo/redo 요청을 처리하는 중인지
  onOpenMemo: () => void; // 선택한 노드의 메모 패널을 연다
  onAddChild: () => void; // 선택한 노드에 자식을 추가한다. useTreeEditorActions의 handleAddNode
  onDelete: () => void; // 선택한 노드를 삭제한다. useTreeEditorActions의 handleDeleteNode
};

/*
함수 이름 : useNodeActions
기능 : 하나만 선택한 노드에 실행할 메모 열기·자식 추가·이름 편집·삭제를 노드 옆 버튼과 단축키가 함께 쓰도록 묶는다.
막힌 동작은 handler를 부르지 않고, 막힌 이유를 돌려줘 화면이 미리 보여 주게 한다.
인자 : UseNodeActionsParams
반환값 : 동작 대상 노드의 clientId(없으면 null), 동작별 막힌 이유, 동작 실행 함수

동작 대상은 노드를 하나만 골랐을 때만 정한다. 추가·삭제 handler는 선택된 노드 중 첫 노드를 대상으로 하므로, 여럿을 고른 채 실행하면
사용자가 어느 노드에 실행되는지 알 수 없다. 이름을 입력 중인 노드는 버튼이 입력창을 가리지 않도록, 강의 중에는 재생 순서가
지금 트리에 맞춰져 있어 대상에서 뺀다.
*/
export function useNodeActions({
  isMutating,
  onOpenMemo,
  onAddChild,
  onDelete,
}: UseNodeActionsParams) {
  /*
  셀렉터가 문자열을 돌려주므로 노드가 움직여도 선택이 같으면 다시 그려지지 않는다. 배열을 돌려주면 매번 새 값이 되어 무한히 다시 그린다.
  */
  const selectedClientId = useTreeStore((state) => {
    const selectedNodes = state.nodes.filter((node) => node.selected);

    return selectedNodes.length === 1 ? selectedNodes[0].id : null;
  });

  const isRenaming = useEditingStore(
    (state) =>
      selectedClientId !== null &&
      state.nameEditingClientIds.has(selectedClientId),
  );
  const isLectureActive = useIsLectureActive();

  const targetClientId =
    isRenaming || isLectureActive ? null : selectedClientId;

  const isRoot = useTreeStore(
    (state) =>
      targetClientId !== null &&
      !state.edges.some((edge) => edge.target === targetClientId),
  );
  const isSaved = useTreeStore(
    (state) =>
      state.nodes.find((node) => node.id === targetClientId)?.data.serverId !=
      null,
  );
  const requestNodeNameEdit = useEditingStore(
    (state) => state.requestNodeNameEdit,
  );

  const blockReasons = useMemo(
    () =>
      Object.fromEntries(
        NODE_ACTION_IDS.map((actionId) => [
          actionId,
          getNodeActionBlockReason({ actionId, isRoot, isSaved, isMutating }),
        ]),
      ) as Record<NodeActionId, string | null>,
    [isMutating, isRoot, isSaved],
  );

  /*
  막힌 동작은 아무것도 하지 않는다. 이유는 이미 툴팁에 보이고, handler까지 가면 같은 이유로 alert이 한 번 더 뜬다.
  */
  const runNodeAction = useCallback(
    (actionId: NodeActionId) => {
      if (targetClientId === null || blockReasons[actionId] !== null) return;

      const handlers: Record<NodeActionId, () => void> = {
        openMemo: onOpenMemo,
        addChild: onAddChild,
        rename: () => requestNodeNameEdit(targetClientId),
        delete: onDelete,
      };

      handlers[actionId]();
    },
    [
      blockReasons,
      onAddChild,
      onDelete,
      onOpenMemo,
      requestNodeNameEdit,
      targetClientId,
    ],
  );

  return { targetClientId, blockReasons, runNodeAction };
}
