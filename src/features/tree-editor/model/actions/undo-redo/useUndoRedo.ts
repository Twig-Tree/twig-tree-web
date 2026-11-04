import { useRef } from "react";
import {
  useAddNodeMutation,
  useDeleteNodeMutation,
  useMoveNodeMutation,
} from "@/src/entities/tree";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { getSubtreeClientIds } from "../../../lib/getSubtreeClientIds";
import { type NodePlacement } from "../../../lib/move-node/getNodePlacement";
import { getNextOrderIndex } from "../../../lib/node";
import { useCollapseStore } from "../../collapse/collapseStore";
import {
  type AddNodeEntry,
  type EditHistoryEntry,
  useEditHistoryStore,
} from "../../history/editHistoryStore";
import { useTreeStore } from "../../treeStore";

type UseUndoRedoParams = {
  treeId: string | null; // 편집 중인 트리 ID. 트리가 없는 워크스페이스는 null
};

type HistoryDirection = "undo" | "redo";

const FAILURE_MESSAGE: Record<HistoryDirection, string> = {
  undo: "되돌리기에 실패했습니다.",
  redo: "다시 실행에 실패했습니다.",
};

/*
기록이 가리키는 노드가 store에 없거나 아직 서버 ID가 없으면 요청을 만들 수 없다.
기록은 서버에 반영된 편집만 남기고 삭제가 성공하면 비우므로 보통은 일어나지 않는다.
*/
const getServerIdOf = (clientId: string): string => {
  const serverId = useTreeStore
    .getState()
    .nodes.find((node) => node.id === clientId)?.data.serverId;

  if (!serverId) throw new Error(`서버 ID가 없는 노드입니다: ${clientId}`);

  return serverId;
};

/*
함수 이름 : useUndoRedo
기능 : 편집 기록을 꺼내 반대 편집(undo) 또는 같은 편집(redo)을 editor store에 먼저 반영하고 서버에 요청한다.
요청이 실패하면 요청 전 구조로 되돌리고 꺼낸 기록도 원래 스택에 돌려놓는다.
인자 : UseUndoRedoParams
반환값 : undo/redo 핸들러, 가능 여부, 요청 상태
*/
export const useUndoRedo = ({ treeId }: UseUndoRedoParams) => {
  const canUndo = useEditHistoryStore((state) => state.past.length > 0);
  const canRedo = useEditHistoryStore((state) => state.future.length > 0);

  const addNodeToStore = useTreeStore((state) => state.addNodeToStore);
  const confirmCreatedNodeInStore = useTreeStore(
    (state) => state.confirmCreatedNodeInStore,
  );
  const deleteNodeFromStore = useTreeStore(
    (state) => state.deleteNodeFromStore,
  );
  const moveNodeInStore = useTreeStore((state) => state.moveNodeInStore);
  const applySiblingOrderInStore = useTreeStore(
    (state) => state.applySiblingOrderInStore,
  );
  const restoreStructureInStore = useTreeStore(
    (state) => state.restoreStructureInStore,
  );
  const expand = useCollapseStore((state) => state.expand);

  const { mutateAsync: addNodeOnServer, isPending: isAddingNode } =
    useAddNodeMutation();
  const { mutateAsync: deleteNodeOnServer, isPending: isDeletingNode } =
    useDeleteNodeMutation();
  const { mutateAsync: moveNodeOnServer, isPending: isMovingNode } =
    useMoveNodeMutation();

  /*
  undo/redo는 연타하면 다음 기록을 꺼내 요청이 겹친다. pending 값은 리렌더 전 클릭을 막지 못하므로 동기 가드를 둔다.
  */
  const isRunningRef = useRef(false);

  /*
  추가를 되돌린다. 기록이 시간순으로 되돌려지므로 그 뒤에 붙은 자식은 이미 되돌려졌지만,
  서버의 삭제가 하위 트리째 지우므로 store도 하위 트리째 지워 둘을 맞춘다.
  */
  const removeAddedNode = async (
    treeId: string,
    { clientId }: AddNodeEntry,
  ) => {
    const serverId = getServerIdOf(clientId);

    deleteNodeFromStore(
      getSubtreeClientIds(useTreeStore.getState().edges, clientId),
    );
    await deleteNodeOnServer({ treeId, nodeId: serverId });
  };

  /*
  되돌린 추가를 같은 신원(clientId)으로 다시 만든다. 서버 ID는 새로 정해져 노드에 채운다.
  순번은 처음 추가할 때처럼 지금 형제의 맨 끝으로 다시 구한다. 서버는 삭제 뒤 순번을 다시 매기지 않아
  처음 순번이 비어 있다는 보장이 없다.
  */
  const recreateAddedNode = async (
    treeId: string,
    { clientId, parentClientId, label }: AddNodeEntry,
  ) => {
    const { nodes, edges } = useTreeStore.getState();
    const parentNode = nodes.find((node) => node.id === parentClientId);
    const parentServerId = getServerIdOf(parentClientId);
    const orderIndex = getNextOrderIndex(parentClientId, nodes, edges);

    expand(treeId, parentServerId); // 부모가 접혀 있으면 다시 만든 노드가 숨겨지므로 펼친다.
    addNodeToStore(
      createEditorNode({
        clientId,
        serverId: null,
        label,
        orderIndex,
        x: (parentNode?.position.x ?? 0) + 150,
        y: parentNode?.position.y ?? 0,
      }),
      createEditorEdge({
        sourceClientId: parentClientId,
        targetClientId: clientId,
      }),
    );

    const createdNode = await addNodeOnServer({
      treeId,
      node: { parentId: parentServerId, orderId: orderIndex, name: label },
    });

    confirmCreatedNodeInStore(clientId, createdNode);
  };

  /*
  노드를 placement 자리로 옮긴다. 접힌 부모 밑으로 옮기면 옮긴 노드가 숨겨지므로 드래그 이동처럼 먼저 펼친다.
  */
  const moveNodeTo = async (
    treeId: string,
    clientId: string,
    { parentClientId, position }: NodePlacement,
  ) => {
    const serverId = getServerIdOf(clientId);
    const parentServerId = getServerIdOf(parentClientId);

    expand(treeId, parentServerId);
    moveNodeInStore({ clientId, parentClientId, position });

    const { siblings, previousSiblings } = await moveNodeOnServer({
      treeId,
      nodeId: serverId,
      parentId: parentServerId,
      position,
    });

    applySiblingOrderInStore([siblings, previousSiblings]);
  };

  const applyHistoryEntry = (
    treeId: string,
    entry: EditHistoryEntry,
    direction: HistoryDirection,
  ) => {
    switch (entry.type) {
      case "add":
        return direction === "undo"
          ? removeAddedNode(treeId, entry)
          : recreateAddedNode(treeId, entry);
      case "move":
        return moveNodeTo(
          treeId,
          entry.clientId,
          direction === "undo" ? entry.from : entry.to,
        );
      /*
      삭제는 성공하면 기록을 비우므로 아직 기록되지 않는다. 하위 트리 복원은 #117 4단계에서 붙인다.
      */
      case "delete":
        throw new Error("삭제 undo/redo는 아직 지원하지 않습니다.");
    }
  };

  /*
  기록을 꺼내 반영하고 요청한다. 실패하면 요청 전 구조로 되돌리고 기록도 돌려놓아 undo/redo가 일어나지 않은 상태로 둔다.
  */
  const runHistory = async (direction: HistoryDirection) => {
    if (treeId === null || isRunningRef.current) return;

    const { takeUndo, takeRedo, cancelUndo, cancelRedo } =
      useEditHistoryStore.getState();
    const entry = direction === "undo" ? takeUndo() : takeRedo();

    if (!entry) return;

    isRunningRef.current = true;

    const { nodes, edges } = useTreeStore.getState(); // 실패하면 이 구조로 되돌린다.

    try {
      await applyHistoryEntry(treeId, entry, direction);
    } catch {
      restoreStructureInStore({ nodes, edges });

      if (direction === "undo") {
        cancelUndo(entry);
      } else {
        cancelRedo(entry);
      }

      alert(FAILURE_MESSAGE[direction]);
    } finally {
      isRunningRef.current = false;
    }
  };

  return {
    handleUndo: () => void runHistory("undo"),
    handleRedo: () => void runHistory("redo"),
    canUndo,
    canRedo,
    isUndoingOrRedoing: isAddingNode || isDeletingNode || isMovingNode,
  };
};
