import { create } from "zustand";
import { temporal } from "zundo";
import {
  addEdge,
  reconnectEdge,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { CustomEditorNode, CustomEditorEdge } from "./types";
import { hasCycle } from "../lib/checkCycle";
import { hasAlreadyParent, isDuplicateEdge } from "../lib/edge";

interface TreeState {
  treeId: string | null;
  nodes: CustomEditorNode[];
  edges: CustomEditorEdge[];
  isDirty: boolean;

  initializeTree: (params: {
    treeId: string;
    nodes: CustomEditorNode[];
    edges: CustomEditorEdge[];
  }) => void;

  resetTree: () => void;

  onNodesChange: OnNodesChange<CustomEditorNode>;
  onEdgesChange: OnEdgesChange;

  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: CustomEditorEdge, newConnection: Connection) => void;
  addNodeToStore: (
    newNode: CustomEditorNode,
    newEdge: CustomEditorEdge,
  ) => void;
  deleteNodeFromStore: (nodeIdsToDelete: string[]) => void;
}

export const useTreeStore = create<TreeState>()(
  temporal(
    (set, get) => ({
      treeId: null,
      nodes: [],
      edges: [],
      isDirty: false,
      initializeTree: ({ treeId, nodes, edges }) => {
        set({
          treeId,
          nodes,
          edges,
          isDirty: false,
        });
      },

      resetTree: () => {
        set({
          treeId: null,
          nodes: [],
          edges: [],
          isDirty: false,
        });
      },

      onNodesChange: (changes) => {
        const shouldMarkDirty = changes.some(
          (change) => change.type !== "select",
        );

        set({
          nodes: applyNodeChanges(changes, get().nodes),
          isDirty: shouldMarkDirty ? true : get().isDirty,
        });
      },

      onEdgesChange: (changes) => {
        const shouldMarkDirty = changes.some(
          (change) => change.type !== "select",
        );

        set({
          edges: applyEdgeChanges(changes, get().edges),
          isDirty: shouldMarkDirty ? true : get().isDirty,
        });
      },

      onConnect: (connection) => {
        const { nodes, edges } = get();

        // 이미 부모가 있는 노드인지 검사
        if (connection.target && hasAlreadyParent(edges, connection.target)) {
          return alert("트리 구조에서는 하나의 부모 노드만 가질 수 있습니다.");
        }

        const potentialEdges = [
          ...edges,
          {
            id: `e-${connection.source}-${connection.target}`,
            source: connection.source,
            target: connection.target,
          },
        ];

        if (hasCycle(nodes, potentialEdges)) return alert("순환 참조 불가");
        if (isDuplicateEdge(edges, connection.source, connection.target))
          return alert("중복 연결 불가");

        set({ edges: addEdge(connection, edges), isDirty: true });
      },

      onReconnect: (oldEdge, newConnection) => {
        const { nodes, edges } = get();

        // Reconnect할 때는 기존 자기 자신의 연결(oldEdge)은 제외하고 다른 부모가 있는지 검사
        const remainingEdges = edges.filter((e) => e.id !== oldEdge.id);

        if (
          newConnection.target &&
          hasAlreadyParent(remainingEdges, newConnection.target)
        ) {
          return alert("트리 구조에서는 하나의 부모 노드만 가질 수 있습니다.");
        }

        const potentialEdges = [
          ...remainingEdges,
          { ...newConnection, id: oldEdge.id },
        ];

        if (hasCycle(nodes, potentialEdges)) return alert("순환 참조 불가");
        if (
          isDuplicateEdge(
            edges,
            newConnection.source,
            newConnection.target,
            oldEdge.id,
          )
        )
          return alert("중복 연결 불가");

        set({
          edges: reconnectEdge(oldEdge, newConnection, edges),
          isDirty: true,
        });
      },

      addNodeToStore: (
        newNode: CustomEditorNode,
        newEdge: CustomEditorEdge,
      ) => {
        const { nodes, edges } = get();

        set({
          nodes: nodes.concat(newNode),
          edges: edges.concat(newEdge),
          isDirty: true,
        });
      },

      deleteNodeFromStore: (nodeIdsToDelete: string[]) => {
        const { nodes, edges } = get();
        const idsToDelete = new Set(nodeIdsToDelete);

        set({
          nodes: nodes.filter((node) => !idsToDelete.has(node.id)),
          edges: edges.filter(
            (edge) =>
              !idsToDelete.has(edge.source) && !idsToDelete.has(edge.target),
          ),
          isDirty: true,
        });
      },
    }),
    {
      // zundo 옵션: 액션 함수들은 히스토리 스택에 쌓이지 않도록 state만 저장
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        isDirty: state.isDirty,
      }),
      // 히스토리 기록 조건 설정
      handleSet: (handleSetAction) => {
        return (state) => {
          const currentStore = useTreeStore.getState();

          // state가 함수형 업데이터인지, 순수 객체인지 판별하여 최종 넥스트 상태를 안전하게 추출
          const partialNextState =
            (typeof state === "function" ? state(currentStore) : state) ?? {};
          const nextNodes = partialNextState.nodes ?? currentStore.nodes;
          const nextEdges = partialNextState.edges ?? currentStore.edges;

          // 조건 1: 노드나 엣지의 개수가 달라졌을 때 (추가 / 삭제)
          const isCountChanged =
            nextNodes.length !== currentStore.nodes.length ||
            nextEdges.length !== currentStore.edges.length;

          // 조건 2: 노드 내부 데이터 중 orderIndex(순서 값)가 실제로 변했을 때 (이동)
          const isOrderChanged = nextNodes.some((nextNode) => {
            const currentNode = currentStore.nodes.find(
              (n) => n.id === nextNode.id,
            );
            if (!currentNode) return false; // 새로 추가된 노드는 countsChanged에서 걸러짐
            return nextNode.data?.orderIndex !== currentNode.data?.orderIndex;
          });

          // 의미 있는 비즈니스 변화일 때만 히스토리 기록
          if (isCountChanged || isOrderChanged) {
            handleSetAction(state);
          }
        };
      },
    },
  ),
);

export const useTreeHistory = () => {
  const { undo, redo, clear, pause, resume, pastStates, futureStates } =
    useTreeStore.temporal.getState();

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  return { undo, redo, clear, pause, resume, canUndo, canRedo };
};
