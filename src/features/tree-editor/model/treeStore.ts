import { create } from "zustand";
import { temporal } from "zundo";
import {
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { TreeNode } from "@/src/entities/tree";
import { CustomEditorNode, CustomEditorEdge } from "./types";
import {
  getMovedElements,
  MoveNodeParams,
} from "../lib/move-node/getMovedElements";
import { getNodesInServerSiblingOrder } from "../lib/move-node/getNodesInServerSiblingOrder";

interface TreeState {
  treeId: string | null;
  nodes: CustomEditorNode[];
  edges: CustomEditorEdge[];

  initializeTree: (params: {
    treeId: string;
    nodes: CustomEditorNode[];
    edges: CustomEditorEdge[];
  }) => void;

  resetTree: () => void;

  onNodesChange: OnNodesChange<CustomEditorNode>;
  onEdgesChange: OnEdgesChange;

  addNodeToStore: (
    newNode: CustomEditorNode,
    newEdge: CustomEditorEdge,
  ) => void;
  deleteNodeFromStore: (clientIdsToDelete: string[]) => void;
  updateNodeMemoInStore: (clientId: string, memo: string | null) => void;
  updateNodeLabelInStore: (clientId: string, label: string) => void;
  selectOnlyNodeInStore: (clientId: string) => void;
  addTagToNodeInStore: (clientId: string, tagId: string) => void;
  removeTagFromNodeInStore: (clientId: string, tagId: string) => void;
  removeTagFromAllNodesInStore: (tagId: string) => void;
  moveNodeInStore: (params: MoveNodeParams) => void;
  applySiblingOrderInStore: (siblingGroups: TreeNode[][]) => void;
}

export const useTreeStore = create<TreeState>()(
  temporal(
    (set, get) => ({
      treeId: null,
      nodes: [],
      edges: [],
      initializeTree: ({ treeId, nodes, edges }) => {
        set({
          treeId,
          nodes,
          edges,
        });
      },

      resetTree: () => {
        set({
          treeId: null,
          nodes: [],
          edges: [],
        });
      },

      /*
      끌기가 아닌 위치 변경(dragging이 false)은 좌표를 반영하지 않는다. 노드의 좌표는 레이아웃이 정하고, 노드를 옮기는 일은
      드래그를 놓았을 때의 노드 이동이 맡는다. 이 변경은 화살표 키 이동과 포인터 드래그의 끝에서 생긴다. 화살표 키 이동은
      onNodeDragStop을 거치지 않아 반영하면 저장되지 않은 좌표가 남고, 포인터 드래그는 onNodeDragStop이 끌기 전 좌표로 되돌린다.
      dragging 표시는 풀어야 하므로 변경을 버리지 않고 좌표만 뺀다.
      */
      onNodesChange: (changes) => {
        const nextChanges = changes.map((change) =>
          change.type === "position" && !change.dragging
            ? { ...change, position: undefined }
            : change,
        );

        set({
          nodes: applyNodeChanges(nextChanges, get().nodes),
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
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
        });
      },

      deleteNodeFromStore: (clientIdsToDelete: string[]) => {
        const { nodes, edges } = get();
        const idsToDelete = new Set(clientIdsToDelete);

        set({
          nodes: nodes.filter((node) => !idsToDelete.has(node.id)),
          edges: edges.filter(
            (edge) =>
              !idsToDelete.has(edge.source) && !idsToDelete.has(edge.target),
          ),
        });
      },

      updateNodeMemoInStore: (clientId: string, memo: string | null) => {
        const { nodes } = get();

        set({
          nodes: nodes.map((node) =>
            node.id === clientId
              ? { ...node, data: { ...node.data, memo } }
              : node,
          ),
        });
      },

      /*
      label 변경은 노드·엣지 개수도 orderIndex도 바꾸지 않으므로 handleSet의 history 기록 조건에 걸리지 않는다.
      따라서 실패 복구를 undo()로 처리할 수 없고, 호출부가 이전 label을 보관했다가 이 action으로 되돌린다.
      */
      updateNodeLabelInStore: (clientId: string, label: string) => {
        const { nodes } = get();

        set({
          nodes: nodes.map((node) =>
            node.id === clientId
              ? { ...node, data: { ...node.data, label } }
              : node,
          ),
        });
      },

      /*
      대상 노드 하나만 선택하고 나머지 노드의 선택을 푼다. 선택된 노드는 selected가 true인 첫 노드로 찾으므로,
      대상만 켜고 나머지를 그대로 두면 이전에 선택된 노드가 기준으로 남을 수 있다.
      selected만 바꾸고 노드·엣지 개수와 orderIndex는 그대로라 handleSet의 history 기록 조건에 걸리지 않는다.
      */
      selectOnlyNodeInStore: (clientId: string) => {
        const { nodes } = get();

        set({
          nodes: nodes.map((node) => {
            const selected = node.id === clientId;

            // 선택 상태가 그대로인 노드는 객체를 재사용해 다시 그려지지 않게 한다.
            return (node.selected ?? false) === selected
              ? node
              : { ...node, selected };
          }),
        });
      },

      /*
      태그 action은 handleSet의 history 기록 조건에 걸리지 않으므로, 요청이 실패하면 undo()가 아니라 반대 action으로 되돌린다.
      */
      addTagToNodeInStore: (clientId: string, tagId: string) => {
        const { nodes } = get();

        set({
          nodes: nodes.map((node) =>
            // 이미 붙은 태그를 다시 붙이면 같은 ID가 두 번 들어가 칩이 겹치므로 그대로 둔다.
            node.id === clientId && !node.data.tagIds.includes(tagId)
              ? {
                  ...node,
                  data: { ...node.data, tagIds: [...node.data.tagIds, tagId] },
                }
              : node,
          ),
        });
      },

      removeTagFromNodeInStore: (clientId: string, tagId: string) => {
        const { nodes } = get();

        set({
          nodes: nodes.map((node) =>
            node.id === clientId && node.data.tagIds.includes(tagId)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    tagIds: node.data.tagIds.filter((id) => id !== tagId),
                  },
                }
              : node,
          ),
        });
      },

      /*
      트리 태그를 지우면 그 태그가 붙은 모든 노드에서도 빠진다. 붙어 있지 않은 노드는 객체를 재사용해 다시 그려지지 않게 한다.
      */
      removeTagFromAllNodesInStore: (tagId: string) => {
        const { nodes } = get();

        set({
          nodes: nodes.map((node) =>
            node.data.tagIds.includes(tagId)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    tagIds: node.data.tagIds.filter((id) => id !== tagId),
                  },
                }
              : node,
          ),
        });
      },

      /*
      노드를 하위 트리째 목적지 부모 밑의 position 번째로 옮긴다. 서버와 같은 규칙으로 형제 orderIndex를 다시 매기므로
      보통은 성공 응답과 같은 상태가 된다. 부모가 바뀌면 엣지 연결이, 순서가 바뀌면 orderIndex가 달라져 history에 기록된다.
      */
      moveNodeInStore: (params: MoveNodeParams) => {
        const { nodes, edges } = get();

        set(getMovedElements(nodes, edges, params));
      },

      /*
      서버가 확정한 형제 순서로 orderIndex와 배열 순서를 맞춘다. 먼저 반영한 이동과 같으면 바꾸지 않아 history에도 남지 않는다.
      다른 탭의 편집으로 순서가 달랐을 때만 바뀌며, 그때는 history에 한 칸이 쌓여 undo 한 번이 이 보정만 되돌린다.
      */
      applySiblingOrderInStore: (siblingGroups: TreeNode[][]) => {
        const { nodes } = get();
        const nextNodes = getNodesInServerSiblingOrder(nodes, siblingGroups);

        if (nextNodes !== nodes) set({ nodes: nextNodes });
      },
    }),
    {
      // zundo 옵션: 액션 함수들은 히스토리 스택에 쌓이지 않도록 state만 저장
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      // 히스토리 기록 조건 설정
      /*
      zundo는 set으로 상태를 바꾼 뒤에 이 함수를 부르고, 인자로는 바뀌기 전 상태를 partialize로 고른 값을 넘긴다.
      따라서 인자가 이전 상태이고 getState()가 이미 바뀐 현재 상태다. 기록하는 값도 이 이전 상태이며, undo가 이 값으로 되돌린다.
      */
      handleSet: (handleSetAction) => {
        return (state) => {
          /*
          zundo 타입은 인자를 setState의 인자 타입으로 선언해 함수형 업데이터까지 포함하지만,
          실제로는 항상 partialize가 고른 { nodes, edges } 객체다.
          */
          const pastState = state as Pick<TreeState, "nodes" | "edges">;
          const currentState = useTreeStore.getState();

          // 조건 1: 노드나 엣지의 개수가 달라졌을 때 (추가 / 삭제)
          const isCountChanged =
            currentState.nodes.length !== pastState.nodes.length ||
            currentState.edges.length !== pastState.edges.length;

          // 조건 2: 노드 내부 데이터 중 orderIndex(순서 값)가 실제로 변했을 때 (이동)
          const isOrderChanged = currentState.nodes.some((currentNode) => {
            const pastNode = pastState.nodes.find(
              (n) => n.id === currentNode.id,
            );
            if (!pastNode) return false; // 새로 추가된 노드는 isCountChanged에서 걸러짐
            return currentNode.data?.orderIndex !== pastNode.data?.orderIndex;
          });

          /*
          조건 3: 엣지 연결이 달라졌을 때 (부모 변경)
          부모를 바꾸는 이동은 엣지 ID를 그대로 두고 source만 바꾼다. 옮긴 노드가 새 부모 밑에서도 같은 orderIndex를 받으면
          조건 1·2에 걸리지 않으므로, 이 조건이 없으면 실패 복구의 undo()가 그 앞의 편집을 되돌린다.
          */
          const pastEdgeById = new Map(
            pastState.edges.map((edge) => [edge.id, edge]),
          );
          const isConnectionChanged = currentState.edges.some((currentEdge) => {
            const pastEdge = pastEdgeById.get(currentEdge.id);
            if (!pastEdge) return false; // 새로 추가된 엣지는 isCountChanged에서 걸러짐
            return (
              currentEdge.source !== pastEdge.source ||
              currentEdge.target !== pastEdge.target
            );
          });

          // 의미 있는 비즈니스 변화일 때만 히스토리 기록
          if (isCountChanged || isOrderChanged || isConnectionChanged) {
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
