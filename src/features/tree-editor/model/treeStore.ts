import { create } from "zustand";
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
  addSubtreeToStore: (
    subtreeNodes: CustomEditorNode[],
    subtreeEdges: CustomEditorEdge[],
  ) => void;
  confirmCreatedNodeInStore: (clientId: string, createdNode: TreeNode) => void;
  deleteNodeFromStore: (clientIdsToDelete: string[]) => void;
  updateNodeMemoInStore: (clientId: string, memo: string | null) => void;
  updateNodeLabelInStore: (clientId: string, label: string) => void;
  selectOnlyNodeInStore: (clientId: string) => void;
  addTagToNodeInStore: (clientId: string, tagId: string) => void;
  removeTagFromNodeInStore: (clientId: string, tagId: string) => void;
  removeTagFromAllNodesInStore: (tagId: string) => void;
  moveNodeInStore: (params: MoveNodeParams) => void;
  applySiblingOrderInStore: (siblingGroups: TreeNode[][]) => void;
  restoreStructureInStore: (
    previousElements: Pick<TreeState, "nodes" | "edges">,
  ) => void;
}

export const useTreeStore = create<TreeState>()((set, get) => ({
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

  addNodeToStore: (newNode: CustomEditorNode, newEdge: CustomEditorEdge) => {
    const { nodes, edges } = get();

    set({
      nodes: nodes.concat(newNode),
      edges: edges.concat(newEdge),
    });
  },

  /*
  지운 하위 트리를 다시 넣는다. 노드는 배열 끝에 붙으므로 하위 트리 루트는 부모의 마지막 자식이 된다.
  원래 자리로 옮기는 일은 호출부가 moveNodeInStore로 한다.
  */
  addSubtreeToStore: (subtreeNodes, subtreeEdges) => {
    const { nodes, edges } = get();

    set({
      nodes: nodes.concat(subtreeNodes),
      edges: edges.concat(subtreeEdges),
    });
  },

  /*
  서버가 확정한 노드 ID를 먼저 추가한 노드에 채운다. 노드의 신원은 클라이언트가 정한 값이라
  교체하지 않으므로 엣지도 손대지 않고, 레이아웃 입력이 되는 구조도 달라지지 않는다.
  서버가 label이나 orderIndex를 보정할 수 있으므로 그 값은 응답으로 덮는다.
  memo와 tagIds는 덮지 않는다. 막 만든 노드는 서버에 메모·태그가 없고, 삭제를 되돌릴 때는 이어서 보내는 요청이 채운다.
  position은 화면 전용 값이라 그대로 둔다.
  */
  confirmCreatedNodeInStore: (clientId: string, createdNode: TreeNode) => {
    const { nodes } = get();

    set({
      nodes: nodes.map((node) =>
        node.id === clientId
          ? {
              ...node,
              data: {
                ...node.data,
                serverId: createdNode.id, // 도메인 모델의 ID는 이미 문자열이다.
                label: createdNode.label,
                orderIndex: createdNode.orderIndex,
              },
            }
          : node,
      ),
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
        node.id === clientId ? { ...node, data: { ...node.data, memo } } : node,
      ),
    });
  },

  /*
  요청이 실패하면 호출부가 이전 label을 보관했다가 이 action으로 되돌린다.
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
  태그 요청이 실패하면 호출부가 반대 action으로 되돌린다.
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
  보통은 성공 응답과 같은 상태가 된다.
  */
  moveNodeInStore: (params: MoveNodeParams) => {
    const { nodes, edges } = get();

    set(getMovedElements(nodes, edges, params));
  },

  /*
  서버가 확정한 형제 순서로 orderIndex와 배열 순서를 맞춘다. 먼저 반영한 이동과 같으면 바꾸지 않아 다시 그려지지 않는다.
  다른 탭의 편집으로 순서가 달랐을 때만 바뀐다.
  */
  applySiblingOrderInStore: (siblingGroups: TreeNode[][]) => {
    const { nodes } = get();
    const nextNodes = getNodesInServerSiblingOrder(nodes, siblingGroups);

    if (nextNodes !== nodes) set({ nodes: nextNodes });
  },

  /*
  요청 전에 보관한 노드·엣지로 구조만 되돌린다. 먼저 반영한 추가·삭제·이동과 undo·redo가 서버에서 실패했을 때 쓴다.
  구조는 노드 집합과 배열 순서, orderIndex, 엣지다. 지금 store에만 있는 노드는 먼저 반영한 추가이므로 빠지고,
  보관한 값에만 있는 노드는 먼저 반영한 삭제이므로 보관한 값으로 되살아난다.

  이동을 반대로 다시 적용하지 않는 것은 형제 orderIndex를 1..n으로 다시 매기기 때문이다. 서버는 삭제 뒤 순번을
  다시 매기지 않아 빈 번호가 있을 수 있는데, store만 다시 매기면 다음 추가의 orderIndex가 서버의 기존 노드와 겹친다.

  label·memo·tagIds와 선택·좌표 같은 나머지 값은 지금 값을 둔다. 요청 중에도 제목·메모·태그 편집은 막혀 있지 않아,
  보관한 값으로 덮으면 그 사이 서버에 저장된 편집이 화면에서 사라진다.
  */
  restoreStructureInStore: (previousElements) => {
    const currentNodeById = new Map(get().nodes.map((node) => [node.id, node]));

    const restoredNodes = previousElements.nodes.map((previousNode) => {
      const currentNode = currentNodeById.get(previousNode.id);

      if (!currentNode) return previousNode;

      // orderIndex가 그대로인 노드는 객체를 재사용해 다시 그려지지 않게 한다.
      return currentNode.data.orderIndex === previousNode.data.orderIndex
        ? currentNode
        : {
            ...currentNode,
            data: {
              ...currentNode.data,
              orderIndex: previousNode.data.orderIndex,
            },
          };
    });

    set({ nodes: restoredNodes, edges: previousElements.edges });
  },
}));
