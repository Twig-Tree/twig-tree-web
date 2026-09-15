import { NODE_ERROR_CODE, useAddNodeMutation } from "@/src/entities/tree";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { ROOT_NODE_LABEL } from "../../../constants/node";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { createClientNodeId } from "../../../lib/createClientNodeId";
import { useTreeStore } from "../../treeStore";
import { CustomEditorNode } from "../../types";

interface UseAddRootNodeParams {
  treeId: string | null; // 루트 노드를 추가할 트리 ID. 트리가 없는 워크스페이스는 null
  nodes: CustomEditorNode[]; // 현재 editor store의 노드 목록. 비어 있을 때만 루트를 추가한다
}

const ROOT_ORDER_INDEX = 1; // 백엔드가 orderId를 1 이상으로 받으므로 첫 노드는 1이다

/*
함수 이름 : useAddRootNode
기능 : 노드가 하나도 없는 트리에 루트 노드를 추가하고, 서버가 확정한 노드를 editor store에 넣는다.
인자 : UseAddRootNodeParams
반환값 : 루트 노드 추가 핸들러와 루트 노드 추가 mutation 상태

자식 노드 추가(useAddNode)와 달리 optimistic update를 하지 않는다. 캔버스가 비어 있어 먼저 그려서 얻는 이득이 작고,
store를 건드리지 않았으므로 실패해도 undo()나 직접 복구가 필요 없다.
*/
export const useAddRootNode = ({ treeId, nodes }: UseAddRootNodeParams) => {
  const addNodeToStore = useTreeStore((state) => state.addNodeToStore);

  const {
    mutate: addNodeOnServer,
    isPending: isAddingRootNode,
    isError: isAddRootNodeError,
  } = useAddNodeMutation();

  /*
  트리당 루트는 하나라 노드가 이미 있으면 요청하지 않는다. 트리가 없는 경우는 트리 생성이 먼저 필요하다.
  */
  const handleAddRootNode = () => {
    if (treeId === null || nodes.length > 0 || isAddingRootNode) return;

    addNodeOnServer(
      {
        treeId,
        node: {
          parentId: null,
          orderId: ROOT_ORDER_INDEX,
          name: ROOT_NODE_LABEL,
        },
      },
      {
        /*
        서버가 확정한 값으로 편집기 노드를 만든다. 들어오는 엣지가 없으므로 노드만 넣는다.
        위치는 레이아웃이 계산하므로 원점에 둔다.

        추가 직후 undo 기록을 비운다. undo는 서버와 연결되어 있지 않아, 되돌리면 서버에 루트가 남은 채 store만 비고
        버튼이 다시 루트 추가로 바뀌어 409가 난다. 루트는 지울 수 없으므로 트리 초기화처럼 편집의 시작점으로 둔다.
        */
        onSuccess: (createdNode) => {
          addNodeToStore(
            createEditorNode({
              clientId: createClientNodeId(),
              serverId: createdNode.id,
              label: createdNode.label,
              orderIndex: createdNode.orderIndex,
              x: 0,
              y: 0,
            }),
          );
          useTreeStore.temporal.getState().clear();
        },
        /*
        다른 탭에서 먼저 루트를 만든 경우다. store는 트리당 한 번만 채워지므로 새로고침해야 그 루트가 보인다.
        */
        onError: (error) => {
          if (getApiErrorCode(error) === NODE_ERROR_CODE.ONE_ROOT_PER_TREE) {
            alert("이미 루트 노드가 있습니다. 새로고침 후 다시 시도해주세요.");
            return;
          }

          alert("노드 추가에 실패했습니다.");
        },
      },
    );
  };

  return {
    handleAddRootNode,
    isAddingRootNode,
    isAddRootNodeError,
  };
};
