import { useRef } from "react";
import {
  useAddNodeMutation,
  useAddNodeTagMutation,
  useDeleteNodeMutation,
  useGetTreeTagsQuery,
  useMoveNodeMutation,
  useUpdateMemoMutation,
  type TreeNode,
} from "@/src/entities/tree";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { getSubtreeCreationOrder } from "../../../lib/delete-node/getSubtreeCreationOrder";
import { getSubtreeClientIds } from "../../../lib/getSubtreeClientIds";
import { type NodePlacement } from "../../../lib/move-node/getNodePlacement";
import { getNextOrderIndex } from "../../../lib/node";
import { useCollapseStore } from "../../collapse/collapseStore";
import {
  type AddNodeEntry,
  type DeleteNodeEntry,
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
하위 트리 루트를 원래 자리로 옮긴 뒤에 되살리기가 실패했음을 알린다. 서버는 이동하면서 형제 순번을 다시 매기고
정리 삭제 뒤에는 다시 매기지 않으므로, 구조 복구로 요청 전 순번을 되돌리면 store와 서버의 순번이 어긋난다.
그러면 다음 추가의 orderIndex가 서버의 기존 노드와 겹쳐 DUPLICATED_ORDER_ID가 난다.
그래서 이동 응답에서 루트만 뺀 형제 순번을 실어 보내고, 구조를 복구한 뒤 그 순번으로 맞춘다.
*/
class RecreateFailedAfterMoveError extends Error {
  constructor(
    readonly siblingsWithoutRoot: TreeNode[], // 이동 응답의 형제 목록에서 되살리던 루트를 뺀 값
    cause: unknown, // 되살리기를 멈추게 한 실제 오류
  ) {
    super("하위 트리 루트를 옮긴 뒤 되살리기에 실패했습니다.", { cause });
  }
}

/*
기록이 가리키는 노드가 store에 없거나 아직 서버 ID가 없으면 요청을 만들 수 없다.
기록은 서버에 반영된 편집만 남기므로 보통은 일어나지 않는다.
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

  const addSubtreeToStore = useTreeStore((state) => state.addSubtreeToStore);
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
  const { mutateAsync: updateMemoOnServer, isPending: isUpdatingMemo } =
    useUpdateMemoMutation();
  const { mutateAsync: addNodeTagOnServer, isPending: isAddingNodeTag } =
    useAddNodeTagMutation();
  const { data: treeTags } = useGetTreeTagsQuery(treeId); // 삭제를 되돌릴 때 그 사이 지워진 태그를 거른다.

  /*
  undo/redo는 연타하면 다음 기록을 꺼내 요청이 겹친다. pending 값은 리렌더 전 클릭을 막지 못하므로 동기 가드를 둔다.
  */
  const isRunningRef = useRef(false);

  /*
  노드를 하위 트리째 지운다. 추가의 undo와 삭제의 redo가 쓴다. 추가를 되돌릴 때는 그 뒤에 붙은 자식이 기록 순서상
  이미 되돌려졌지만, 서버의 삭제가 하위 트리째 지우므로 store도 하위 트리째 지워 둘을 맞춘다.
  */
  const deleteSubtree = async (treeId: string, clientId: string) => {
    const serverId = getServerIdOf(clientId);

    deleteNodeFromStore(
      getSubtreeClientIds(useTreeStore.getState().edges, clientId),
    );
    await deleteNodeOnServer({ treeId, nodeId: serverId });
  };

  /*
  추가를 되돌린다. 지우기 직전의 제목·메모·태그로 기록을 고쳐 써서, redo가 고친 값으로 되살리게 한다.
  */
  const removeAddedNode = async (treeId: string, entry: AddNodeEntry) => {
    const addedNode = useTreeStore
      .getState()
      .nodes.find((node) => node.id === entry.clientId);
    const nextEntry: AddNodeEntry = addedNode
      ? {
          ...entry,
          label: addedNode.data.label,
          memo: addedNode.data.memo,
          tagIds: addedNode.data.tagIds,
        }
      : entry;

    await deleteSubtree(treeId, entry.clientId);

    useEditHistoryStore.getState().replaceLatestRedo(entry, nextEntry);
  };

  /*
  되돌린 추가를 같은 신원(clientId)으로 다시 만든다. 노드 하나짜리 하위 트리를 부모의 맨 끝에 되살리는 것과 같아,
  메모·태그 복원과 실패 시 정리를 recreateSubtree에 맡긴다. 처음 추가할 때도 맨 끝에 붙었으므로 자리도 같다.
  */
  const recreateAddedNode = (
    treeId: string,
    { clientId, parentClientId, label, memo, tagIds }: AddNodeEntry,
  ) => {
    const { nodes, edges } = useTreeStore.getState();
    const parentNode = nodes.find((node) => node.id === parentClientId);
    const siblingCount = edges.filter(
      (edge) => edge.source === parentClientId,
    ).length;
    const node = createEditorNode({
      clientId,
      serverId: null,
      label,
      orderIndex: 0, // recreateSubtree가 맨 끝 순번으로 정한다.
      x: (parentNode?.position.x ?? 0) + 150,
      y: parentNode?.position.y ?? 0,
    });

    return recreateSubtree(treeId, {
      clientId,
      placement: { parentClientId, position: siblingCount + 1 },
      nodes: [{ ...node, data: { ...node.data, memo, tagIds } }],
      edges: [
        createEditorEdge({
          sourceClientId: parentClientId,
          targetClientId: clientId,
        }),
      ],
    });
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

  /*
  지운 하위 트리를 같은 신원(clientId)으로 다시 만든다. 삭제의 undo와 추가의 redo가 쓴다. 서버에 복원 API가 없어 노드마다 새로 만들고, 서버 ID는 새로 정해진다.
  1. 하위 트리 루트를 원래 부모의 맨 끝에 만든다. 원래 순번은 그 사이 다른 노드가 차지했을 수 있다.
  2. 원래 자리가 맨 끝이 아니면 그 자리로 옮긴다.
  3. 나머지 노드를 부모 → 자식 순서로 원래 순번에 만든다. 새로 만든 부모 밑이라 순번이 겹치지 않는다.
  4. 노드를 만들 때마다 메모와 태그를 되살린다. 그 사이 트리에서 지워진 태그는 건너뛴다.
  중간에 실패하면 만든 하위 트리 루트를 지워 서버에 일부만 남지 않게 한다. 하위 노드는 서버가 함께 지운다.
  루트를 옮긴 뒤에 실패했다면 RecreateFailedAfterMoveError로 서버가 다시 매긴 형제 순번을 함께 넘긴다.
  */
  const recreateSubtree = async (
    treeId: string,
    {
      clientId: rootClientId,
      placement,
      nodes,
      edges,
    }: Omit<DeleteNodeEntry, "type">,
  ) => {
    const current = useTreeStore.getState();
    const parentServerId = getServerIdOf(placement.parentClientId);
    const rootOrderIndex = getNextOrderIndex(
      placement.parentClientId,
      current.nodes,
      current.edges,
    );
    const existingTagIds = treeTags
      ? new Set(treeTags.map((tag) => tag.id))
      : null; // 태그 목록을 아직 받지 못했으면 거르지 않고 서버에 맡긴다.

    /*
    지운 시점의 서버 ID는 더 이상 없으므로 비우고, 응답을 받을 때마다 채운다. 선택은 풀어 둔다.
    */
    const restoredNodes = nodes.map((node) => ({
      ...node,
      selected: false,
      data: {
        ...node.data,
        serverId: null,
        orderIndex:
          node.id === rootClientId ? rootOrderIndex : node.data.orderIndex,
        tagIds: existingTagIds
          ? node.data.tagIds.filter((tagId) => existingTagIds.has(tagId))
          : node.data.tagIds,
      },
    }));
    const siblingCount =
      current.edges.filter((edge) => edge.source === placement.parentClientId)
        .length + 1;
    const isAtEnd = placement.position >= siblingCount; // 맨 끝이 원래 자리면 옮기지 않는다.

    expand(treeId, parentServerId); // 부모가 접혀 있으면 되살린 노드가 숨겨지므로 펼친다.
    addSubtreeToStore(restoredNodes, edges);
    if (!isAtEnd) moveNodeInStore({ clientId: rootClientId, ...placement });

    let createdRootServerId: string | null = null;
    let siblingsAfterMove: TreeNode[] | null = null; // 루트 이동 응답의 형제 목록. 옮기지 않았으면 null

    try {
      for (const { node, parentClientId } of getSubtreeCreationOrder(
        restoredNodes,
        edges,
        rootClientId,
      )) {
        const createdNode = await addNodeOnServer({
          treeId,
          node: {
            parentId: getServerIdOf(parentClientId),
            orderId: node.data.orderIndex,
            name: node.data.label,
          },
        });

        confirmCreatedNodeInStore(node.id, createdNode);

        if (node.id === rootClientId) {
          createdRootServerId = createdNode.id;

          if (!isAtEnd) {
            const { siblings, previousSiblings } = await moveNodeOnServer({
              treeId,
              nodeId: createdNode.id,
              parentId: parentServerId,
              position: placement.position,
            });

            applySiblingOrderInStore([siblings, previousSiblings]);
            siblingsAfterMove = siblings;
          }
        }

        if (node.data.memo !== null) {
          await updateMemoOnServer({
            treeId,
            nodeId: createdNode.id,
            content: node.data.memo,
          });
        }

        for (const tagId of node.data.tagIds) {
          await addNodeTagOnServer({ treeId, nodeId: createdNode.id, tagId });
        }
      }
    } catch (error) {
      if (createdRootServerId === null) throw error;

      const rootServerId = createdRootServerId;

      await deleteNodeOnServer({ treeId, nodeId: rootServerId }).catch(
        () => {}, // 정리 요청까지 실패하면 서버에 일부가 남는다. 새로고침하면 그 상태가 보인다.
      );

      if (siblingsAfterMove === null) throw error;

      throw new RecreateFailedAfterMoveError(
        siblingsAfterMove.filter((sibling) => sibling.id !== rootServerId),
        error,
      );
    }
  };

  /*
  되살렸던 하위 트리를 다시 지우고, 지우기 직전의 노드·엣지로 기록을 고쳐 쓴다. 되살린 뒤 고친 메모·태그·제목은
  기록에 남지 않으므로, 고쳐 쓰지 않으면 다음 undo가 처음 지운 시점의 값으로 되살린다.
  */
  const deleteSubtreeAgain = async (treeId: string, entry: DeleteNodeEntry) => {
    const { nodes, edges } = useTreeStore.getState();
    const subtreeClientIds = new Set(
      getSubtreeClientIds(edges, entry.clientId),
    );
    const nextEntry: DeleteNodeEntry = {
      ...entry,
      nodes: nodes.filter((node) => subtreeClientIds.has(node.id)),
      edges: edges.filter((edge) => subtreeClientIds.has(edge.target)),
    };

    await deleteSubtree(treeId, entry.clientId);

    useEditHistoryStore.getState().replaceLatestUndo(entry, nextEntry);
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
      case "delete":
        return direction === "undo"
          ? recreateSubtree(treeId, entry)
          : deleteSubtreeAgain(treeId, entry);
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
    } catch (error) {
      restoreStructureInStore({ nodes, edges });

      if (error instanceof RecreateFailedAfterMoveError) {
        applySiblingOrderInStore([error.siblingsWithoutRoot]);
      }

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
    isUndoingOrRedoing:
      isAddingNode ||
      isDeletingNode ||
      isMovingNode ||
      isUpdatingMemo ||
      isAddingNodeTag,
  };
};
