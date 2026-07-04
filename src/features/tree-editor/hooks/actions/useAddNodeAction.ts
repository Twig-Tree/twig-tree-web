import { useAddNodeMutation } from "@/src/entities/tree/model/mutations/useAddNodeMutation";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { getNextOrderIndex } from "../../lib/node";
import { useTreeStore } from "../../model/treeStore";
import { CustomEditorEdge, CustomEditorNode } from "../../model/types";

type UseAddNodeActionParams = {
  treeId: string; // 노드를 추가할 트리 ID
  selectedNode: CustomEditorNode | undefined; // 자식 노드를 추가할 기준 노드
  nodes: CustomEditorNode[]; // 현재 editor store의 노드 목록
  edges: CustomEditorEdge[]; // 현재 editor store의 엣지 목록
};

/*
함수 이름 : useAddNodeAction
기능 : 선택된 노드의 자식 노드를 optimistic update로 editor store에 추가하고, 서버 요청 성공/실패 결과에 따라 store 상태를 보정하거나 rollback한다.
인자 : UseAddNodeActionParams
반환값 : 노드 추가 핸들러와 노드 추가 mutation 상태
*/
export const useAddNodeAction = ({
  treeId,
  selectedNode,
  nodes,
  edges,
}: UseAddNodeActionParams) => {
  const addNodeToStore = useTreeStore((state) => state.addNodeToStore);
  const rollbackAddNode = useTreeStore((state) => state.rollbackAddNode);

  const {
    mutate: addNodeOnServer,
    isPending: isAddingNode,
    isError: isAddNodeError,
  } = useAddNodeMutation();

  /*
  선택된 노드를 기준으로 새 자식 노드를 생성하고 서버에 노드 추가 요청을 보낸다.
  */
  const handleAddNode = () => {
    if (!selectedNode || isAddingNode) return;

    const parentId = Number(selectedNode.id); // 서버 요청에 사용할 부모 노드 ID를 숫자로 변환한다.
    if (Number.isNaN(parentId)) return;

    /*
    선택된 노드의 기존 자식 노드 정보를 기준으로 새 노드의 순서, 임시 ID, 라벨을 만든다.
    */
    const nextOrderIndex = getNextOrderIndex(selectedNode.id, nodes, edges);
    const newNodeId = `temp_${crypto.randomUUID()}`; // 서버 응답 전까지 사용할 임시 노드 ID를 생성한다.
    const label = `Added node ${nextOrderIndex}`;

    /*
    React Flow editor store에 먼저 반영할 임시 노드와 엣지를 생성한다.
    */
    const newNode = createEditorNode({
      id: newNodeId,
      label,
      orderIndex: nextOrderIndex,
      x: selectedNode.position.x + 150,
      y: selectedNode.position.y,
    });

    const newEdge = createEditorEdge({
      sourceNodeId: selectedNode.id,
      targetNodeId: newNodeId,
    });

    const wasDirtyBeforeAdd = useTreeStore.getState().isDirty; // 실패 시 이전 dirty 상태로 복구하기 위해 저장한다.

    /*
    서버 응답을 기다리기 전에 editor store에 임시 노드와 엣지를 추가한다.
    */
    addNodeToStore(newNode, newEdge);

    /*
    서버에 노드 추가 요청을 보내고, 결과에 따라 editor store의 임시 상태를 확정하거나 rollback한다.
    */
    addNodeOnServer(
      {
        treeId,
        node: {
          parentId: parentId,
          orderId: nextOrderIndex,
          name: label,
        },
      },
      {
        /*
        서버에서 실제 노드 ID를 받으면 editor store의 임시 노드 ID와 엣지 target을 실제 ID로 교체한다.
        */
        onSuccess: (createdNode) => {
          const realNodeId = String(createdNode.nodeId);

          useTreeStore.setState((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === newNodeId
                ? {
                    ...node,
                    id: realNodeId,
                    data: {
                      ...node.data,
                    },
                  }
                : node,
            ),
            edges: state.edges.map((edge) =>
              edge.target === newNodeId
                ? {
                    ...edge,
                    id: `e-${edge.source}-${realNodeId}`,
                    target: realNodeId,
                  }
                : edge,
            ),
          }));
        },
        /*
        서버 요청이 실패하면 editor store에 추가했던 임시 노드와 엣지를 제거하고 이전 dirty 상태를 복구한다.
        */
        onError: () => {
          rollbackAddNode(newNodeId, wasDirtyBeforeAdd);
          alert("노드 추가에 실패했습니다.");
        },
      },
    );
  };

  return {
    handleAddNode,
    isAddingNode,
    isAddNodeError,
  };
};
