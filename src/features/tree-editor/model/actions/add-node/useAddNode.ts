import { useAddNodeMutation } from "@/src/entities/tree/model/mutations/useAddNodeMutation";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { getNextOrderIndex } from "../../../lib/node";
import { useTreeStore } from "../../treeStore";
import { CustomEditorEdge, CustomEditorNode } from "../../types";

interface UseAddNodeParams {
  treeId: string; // 노드를 추가할 트리 ID
  selectedNode: CustomEditorNode | undefined; // 자식 노드를 추가할 기준 노드
  nodes: CustomEditorNode[]; // 현재 editor store의 노드 목록
  edges: CustomEditorEdge[]; // 현재 editor store의 엣지 목록
}

/*
함수 이름 : useAddNode
기능 : 선택된 노드의 자식 노드를 optimistic update로 editor store에 추가하고, 서버 요청 성공/실패 결과에 따라 store 상태를 보정하거나 rollback한다.
인자 : UseAddNodeParams
반환값 : 노드 추가 핸들러와 노드 추가 mutation 상태
*/
export const useAddNode = ({
  treeId,
  selectedNode,
  nodes,
  edges,
}: UseAddNodeParams) => {
  const addNodeToStore = useTreeStore((state) => state.addNodeToStore);

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

    const numericParentId = Number(selectedNode.id); // 부모 노드 ID가 서버 ID로 변환 가능한지 검증한다.
    if (Number.isNaN(numericParentId)) {
      alert("아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

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
          parentId: selectedNode.id,
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
        서버 요청이 실패하면 추가 전의 editor store 상태로 복구한다.
        */
        onError: () => {
          useTreeStore.temporal.getState().undo();
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
