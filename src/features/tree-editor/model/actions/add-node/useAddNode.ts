import { useAddNodeMutation } from "@/src/entities/tree/model/mutations/useAddNodeMutation";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { createClientNodeId } from "../../../lib/createClientNodeId";
import { getNextOrderIndex } from "../../../lib/node";
import { useCollapseStore } from "../../collapse/collapseStore";
import { useEditHistoryStore } from "../../history/editHistoryStore";
import { useTreeStore } from "../../treeStore";
import { CustomEditorEdge, CustomEditorNode } from "../../types";

interface UseAddNodeParams {
  treeId: string | null; // 노드를 추가할 트리 ID. 트리가 없는 워크스페이스는 null
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
  const confirmCreatedNodeInStore = useTreeStore(
    (state) => state.confirmCreatedNodeInStore,
  );
  const restoreStructureInStore = useTreeStore(
    (state) => state.restoreStructureInStore,
  );
  const expand = useCollapseStore((state) => state.expand);
  const recordEdit = useEditHistoryStore((state) => state.record);

  const {
    mutate: addNodeOnServer,
    isPending: isAddingNode,
    isError: isAddNodeError,
  } = useAddNodeMutation();

  /*
  선택된 노드를 기준으로 새 자식 노드를 생성하고 서버에 노드 추가 요청을 보낸다.
  */
  const handleAddNode = () => {
    /*
    트리가 없으면 노드도 없어 선택된 노드가 있을 수 없지만, 요청에 treeId가 필요하므로 타입을 좁힌다.
    */
    if (treeId === null || !selectedNode || isAddingNode) return;

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
    부모가 접혀 있으면 새 자식이 숨겨진 채로 추가되므로 먼저 펼친다.
    요청이 실패해 노드를 되돌려도 펼친 상태는 그대로 둔다. 사용자는 이 노드에 자식을 붙이려 했으므로
    펼친 채로 두는 것이 자연스럽고, 접힘 상태는 editor store의 구조가 아니라 되돌릴 대상도 아니다.
    */
    expand(treeId, parentServerId);

    const { nodes: nodesBeforeAdd, edges: edgesBeforeAdd } =
      useTreeStore.getState(); // 실패하면 이 추가 전 구조로 되돌린다.

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
        서버가 확정한 노드 ID를 채운다. 서버에 반영된 뒤에야 되돌릴 요청을 만들 수 있으므로 undo 기록도 이때 남긴다.
        */
        onSuccess: (createdNode) => {
          confirmCreatedNodeInStore(newClientId, createdNode);

          recordEdit({
            type: "add",
            clientId: newClientId,
            parentClientId: selectedNode.id,
            label: createdNode.label,
          });
        },
        /*
        서버 요청이 실패하면 추가 전 구조로 되돌린다. 추가한 노드와 엣지만 빠진다.
        */
        onError: () => {
          restoreStructureInStore({
            nodes: nodesBeforeAdd,
            edges: edgesBeforeAdd,
          });
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
