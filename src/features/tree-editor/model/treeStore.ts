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
import { getNextOrderIndex } from "@/src/features/tree-editor/lib/node";

interface TreeState {
  nodes: CustomEditorNode[];
  edges: CustomEditorEdge[];
  onNodesChange: OnNodesChange<CustomEditorNode>;
  onEdgesChange: OnEdgesChange;

  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: CustomEditorEdge, newConnection: Connection) => void;
  onAdd: () => void;
  onDelete: () => void;
}

export const useTreeStore = create<TreeState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
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

        set({ edges: addEdge(connection, edges) });
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
        if (isDuplicateEdge(edges, newConnection.source, newConnection.target))
          return alert("중복 연결 불가");

        set({ edges: reconnectEdge(oldEdge, newConnection, edges) });
      },

      onAdd: () => {
        const { nodes, edges } = get();
        const selectedNode = nodes.find((n) => n.selected);
        if (!selectedNode) return;

        const nextOrderIndex = getNextOrderIndex(selectedNode.id, nodes, edges);
        const newNodeId = `node_${Date.now()}`;

        const newNode = {
          id: newNodeId,
          type: "custom",
          data: {
            label: `Added node ${nextOrderIndex}`,
            orderIndex: nextOrderIndex,
          },
          // 부모 노드 근처에 생성 (이후 ELK 레이아웃 동작)
          position: {
            x: selectedNode.position.x + 150,
            y: selectedNode.position.y,
          },
        };

        const newEdge = {
          id: `e-${selectedNode.id}-${newNodeId}`,
          type: "smoothstep",
          source: selectedNode.id,
          target: newNodeId,
        };

        set({
          nodes: nodes
            .map((node) =>
              node.id === selectedNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      label: node.data.label ?? "",
                    },
                  }
                : node,
            )
            .concat(newNode as unknown as CustomEditorNode),
          edges: edges.concat(newEdge as unknown as CustomEditorEdge),
        });
      },

      onDelete: () => {
        const { nodes, edges } = get();
        const selectedNode = nodes.find((n) => n.selected);
        if (!selectedNode) return;

        // 1. 지울 대상을 모아둘 블랙리스트(Set)와 탐색용 바구니(Queue) 초기화
        const idsToDelete = new Set<string>([selectedNode.id]);
        const queue = [selectedNode.id];

        // 2. 평면 엣지 데이터를 기반으로 트리 아래 방향(BFS)으로 순회하며 자식 ID 수집
        while (queue.length > 0) {
          const currentId = queue.shift()!;

          edges.forEach((edge) => {
            // 현재 노드가 출발지(source)라면 목적지(target)는 자식 노드이므로 삭제 대상으로 추가
            if (edge.source === currentId) {
              idsToDelete.add(edge.target);
              queue.push(edge.target);
            }
          });
        }

        // 3. 상태 일괄 업데이트: 블랙리스트에 걸린 노드와 엣지 필터링
        // 다른 부모/형제 노드들은 객체 불변성이 유지되어 메모리 주소 보존
        set({
          nodes: nodes.filter((node) => !idsToDelete.has(node.id)),
          edges: edges.filter(
            (edge) =>
              !idsToDelete.has(edge.source) && !idsToDelete.has(edge.target),
          ),
        });
      },
    }),
    {
      // zundo 옵션: 액션 함수들은 히스토리 스택에 쌓이지 않도록 state만 저장
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
      // 히스토리 기록 조건 설정
      handleSet: (handleSetAction) => {
        return (state) => {
          const currentStore = useTreeStore.getState();

          // state가 함수형 업데이터인지, 순수 객체인지 판별하여 최종 넥스트 상태를 안전하게 추출
          const nextState =
            typeof state === "function" ? state(currentStore) : state;

          // 조건 1: 노드나 엣지의 개수가 달라졌을 때 (추가 / 삭제)
          const isCountChanged =
            nextState.nodes?.length !== currentStore.nodes.length ||
            nextState.edges?.length !== currentStore.edges.length;

          // 조건 2: 노드 내부 데이터 중 orderIndex(순서 값)가 실제로 변했을 때 (이동)
          const isOrderChanged = nextState.nodes?.some((nextNode) => {
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
