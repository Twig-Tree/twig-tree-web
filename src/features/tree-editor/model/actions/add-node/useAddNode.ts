import { useAddNodeMutation } from "@/src/entities/tree/model/mutations/useAddNodeMutation";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { createClientNodeId } from "../../../lib/createClientNodeId";
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

    const parentServerId = selectedNode.data.serverId; // 자식 노드 추가 요청에 사용할 부모 노드의 서버 ID

    /*
    부모가 아직 서버에 없으면 자식의 parentId를 정할 수 없어 요청을 보낼 수 없다.
    막는 것은 편집이 아니라 서버 전송이며, 대기·큐 방식은 배치 저장(#54)과 함께 정한다.
    */
    if (parentServerId === null) {
      alert("아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    /*
    선택된 노드의 기존 자식 노드 정보를 기준으로 새 노드의 순서, 신원, 라벨을 만든다.
    */
    const nextOrderIndex = getNextOrderIndex(selectedNode.id, nodes, edges);
    const newClientId = createClientNodeId(); // 이 신원은 서버 응답과 무관하게 세션 동안 유지된다.
    const label = `Added node ${nextOrderIndex}`;

    /*
    React Flow editor store에 먼저 반영할 노드와 엣지를 생성한다.
    */
    const newNode = createEditorNode({
      clientId: newClientId,
      serverId: null, // 서버 응답을 받기 전이라 아직 서버 ID가 없다.
      label,
      orderIndex: nextOrderIndex,
      x: selectedNode.position.x + 150,
      y: selectedNode.position.y,
    });

    const newEdge = createEditorEdge({
      sourceClientId: selectedNode.id,
      targetClientId: newClientId,
    });

    /*
    서버 응답을 기다리기 전에 editor store에 노드와 엣지를 추가한다.
    */
    addNodeToStore(newNode, newEdge);

    /*
    서버에 노드 추가 요청을 보내고, 결과에 따라 editor store의 임시 상태를 확정하거나 rollback한다.
    */
    addNodeOnServer(
      {
        treeId,
        node: {
          parentId: parentServerId,
          orderId: nextOrderIndex,
          name: label,
        },
      },
      {
        /*
        서버가 확정한 노드 ID를 노드 자신에게 채운다. 노드의 신원은 클라이언트가 정한 값이라
        교체하지 않으므로 엣지도 손대지 않고, 레이아웃 입력이 되는 구조도 달라지지 않는다.
        서버가 label이나 orderIndex를 보정할 수 있으므로 그 값은 응답으로 덮는다.
        position은 화면 전용 값이라 그대로 둔다.
        */
        onSuccess: (createdNode) => {
          useTreeStore.setState((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === newClientId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      serverId: createdNode.id, // 도메인 모델의 ID는 이미 문자열이다.
                      label: createdNode.label,
                      orderIndex: createdNode.orderIndex,
                      memo: createdNode.memo,
                    },
                  }
                : node,
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
