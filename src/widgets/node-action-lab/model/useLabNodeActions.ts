import { useCallback, useRef, useState } from "react";
import {
  getSubtreeClientIds,
  useCollapseStore,
  useTreeStore,
  validateNodeName,
} from "@/src/features/tree-editor";
import {
  createLabChildElements,
  getNodeActionBlockReason,
  type NodeActionEntry,
  type NodeActionId,
} from "./nodeActions";

const MAX_LOG_ENTRIES = 30; // 오래된 기록은 버린다. 비교에는 최근 몇 번의 실행이면 충분하다

export type NodeActionLogEntry = {
  id: number;
  entry: NodeActionEntry; // 동작을 실행한 진입점
  actionId: NodeActionId;
  nodeLabel: string; // 실행 시점의 대상 노드 이름. 노드가 지워져도 기록은 남는다
  blockReason: string | null; // 막혔으면 그 이유, 실행했으면 null
};

/*
함수 이름 : useLabNodeActions
기능 : 실험실의 노드 동작을 서버 없이 editor store에서 실행하고, 진입점과 결과를 실행 기록에 남긴다.
메모 열기와 이름 편집은 열린 패널·입력창의 대상 노드를 정한다.
인자 : string treeId -> 지금 store를 채운 실험실 트리 ID. 접힘 상태가 트리 ID별로 저장된다
반환값 : 동작 실행 함수, 막힘 이유 조회, 메모·이름 편집 대상과 그 조작, 실행 기록
*/
export function useLabNodeActions(treeId: string) {
  const addNodeToStore = useTreeStore((state) => state.addNodeToStore);
  const deleteNodeFromStore = useTreeStore(
    (state) => state.deleteNodeFromStore,
  );
  const updateNodeLabelInStore = useTreeStore(
    (state) => state.updateNodeLabelInStore,
  );
  const edges = useTreeStore((state) => state.edges);
  const expand = useCollapseStore((state) => state.expand);

  const [memoClientId, setMemoClientId] = useState<string | null>(null);
  const [renamingClientId, setRenamingClientId] = useState<string | null>(null);
  const [log, setLog] = useState<NodeActionLogEntry[]>([]);
  const nextLogIdRef = useRef(0);

  const appendLog = useCallback((entry: Omit<NodeActionLogEntry, "id">) => {
    const id = nextLogIdRef.current;
    nextLogIdRef.current += 1;

    setLog((previous) =>
      [{ ...entry, id }, ...previous].slice(0, MAX_LOG_ENTRIES),
    );
  }, []);

  const getBlockReason = useCallback(
    (actionId: NodeActionId, clientId: string) =>
      getNodeActionBlockReason(actionId, clientId, edges),
    [edges],
  );

  /*
  진입점이 무엇이든 같은 함수로 실행한다. 진입 방식만 바꿔 가며 비교하려면 동작 자체는 같아야 한다.
  */
  const runAction = useCallback(
    (actionId: NodeActionId, entry: NodeActionEntry, clientId: string) => {
      const { nodes, edges: currentEdges } = useTreeStore.getState();
      const node = nodes.find((item) => item.id === clientId);
      if (!node) return;

      const blockReason = getNodeActionBlockReason(
        actionId,
        clientId,
        currentEdges,
      );

      appendLog({ entry, actionId, nodeLabel: node.data.label, blockReason });

      if (blockReason) return;

      if (actionId === "openMemo") {
        setMemoClientId(clientId);
        return;
      }

      if (actionId === "rename") {
        setRenamingClientId(clientId);
        return;
      }

      if (actionId === "addChild") {
        const { node: childNode, edge } = createLabChildElements(
          node,
          nodes,
          currentEdges,
        );

        /*
        부모가 접혀 있으면 새 자식이 숨겨진 채로 추가되므로 먼저 펼친다. 제품의 노드 추가와 같다.
        */
        if (node.data.serverId !== null) expand(treeId, node.data.serverId);

        addNodeToStore(childNode, edge);
        return;
      }

      /*
      하위 트리째 지운다. 지운 노드의 메모 패널이나 이름 입력창이 열려 있으면 함께 닫는다.
      */
      const deletedIds = new Set(getSubtreeClientIds(currentEdges, clientId));

      deleteNodeFromStore(Array.from(deletedIds));
      setMemoClientId((current) =>
        current !== null && deletedIds.has(current) ? null : current,
      );
      setRenamingClientId((current) =>
        current !== null && deletedIds.has(current) ? null : current,
      );
    },
    [addNodeToStore, appendLog, deleteNodeFromStore, expand, treeId],
  );

  /*
  함수 이름 : commitRename
  기능 : 이름 입력창의 값을 검사해 통과하면 store의 노드 이름을 바꾸고 입력창을 닫는다.
  인자 : string clientId -> 이름을 바꿀 노드의 편집기 노드 ID
  string name -> 입력한 이름
  반환값 : 검사에 걸리면 안내 문구, 저장했으면 null
  */
  const commitRename = useCallback(
    (clientId: string, name: string): string | null => {
      const errorMessage = validateNodeName(name);
      if (errorMessage) return errorMessage;

      updateNodeLabelInStore(clientId, name.trim());
      setRenamingClientId(null);
      return null;
    },
    [updateNodeLabelInStore],
  );

  const cancelRename = useCallback(() => setRenamingClientId(null), []);
  const closeMemo = useCallback(() => setMemoClientId(null), []);
  const clearLog = useCallback(() => setLog([]), []);

  /*
  트리를 처음 상태로 되돌리면 지금 열린 패널과 입력창의 대상이 사라지므로 함께 닫는다. 기록은 비교에 쓰므로 남긴다.
  */
  const closeOverlays = useCallback(() => {
    setMemoClientId(null);
    setRenamingClientId(null);
  }, []);

  return {
    runAction,
    getBlockReason,
    memoClientId,
    closeMemo,
    renamingClientId,
    commitRename,
    cancelRename,
    closeOverlays,
    log,
    clearLog,
  };
}
