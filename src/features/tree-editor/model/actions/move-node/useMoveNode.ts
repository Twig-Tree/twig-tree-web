import { NODE_ERROR_CODE, useMoveNodeMutation } from "@/src/entities/tree";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { MoveNodeParams } from "../../../lib/move-node/getMovedElements";
import { getNodePlacement } from "../../../lib/move-node/getNodePlacement";
import { useEditHistoryStore } from "../../history/editHistoryStore";
import { useTreeStore } from "../../treeStore";

type UseMoveNodeParams = {
  treeId: string | null; // 노드가 속한 트리 ID. 트리가 없는 워크스페이스는 null
};

const UNSAVED_NODE_MESSAGE =
  "아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해 주세요.";

/*
함수 이름 : getMoveNodeErrorMessage
기능 : 노드 이동 실패를 사용자에게 알릴 문구로 바꾼다.
인자 : unknown error -> 노드 이동 요청이 던진 오류
반환값 : 알림 문구
*/
const getMoveNodeErrorMessage = (error: unknown): string => {
  switch (getApiErrorCode(error)) {
    case NODE_ERROR_CODE.ROOT_NODE_NOT_MOVABLE:
      return "루트 노드는 옮길 수 없습니다.";
    case NODE_ERROR_CODE.INVALID_MOVE_TARGET:
      return "자기 자신이나 하위 노드 밑으로는 옮길 수 없습니다.";
    /*
    화면의 형제 수로 계산한 순번이 서버 범위를 벗어났다면 다른 곳에서 트리가 바뀐 것이다.
    editor store는 트리당 한 번만 채우므로 새로고침해야 서버 상태를 받는다.
    */
    case NODE_ERROR_CODE.INVALID_POSITION:
      return "트리가 다른 곳에서 바뀌었습니다. 새로고침한 뒤 다시 시도해 주세요.";
    default:
      return "노드 이동에 실패했습니다.";
  }
};

/*
함수 이름 : useMoveNode
기능 : 노드를 하위 트리째 목적지 부모 밑의 position 번째로 옮기는 함수를 만든다. editor store에 먼저 반영하고,
성공하면 서버가 다시 매긴 형제 순서로 store를 맞추며, 실패하면 이동 전 구조로 되돌린다.
인자 : UseMoveNodeParams
반환값 : 노드 이동 함수와 노드 이동 mutation 상태
*/
export const useMoveNode = ({ treeId }: UseMoveNodeParams) => {
  const moveNodeInStore = useTreeStore((state) => state.moveNodeInStore);
  const applySiblingOrderInStore = useTreeStore(
    (state) => state.applySiblingOrderInStore,
  );
  const restoreStructureInStore = useTreeStore(
    (state) => state.restoreStructureInStore,
  );
  const recordEdit = useEditHistoryStore((state) => state.record);
  const { mutate: moveNodeOnServer, isPending: isMovingNode } =
    useMoveNodeMutation();

  /*
  목적지는 드래그를 놓은 지점에서 정해지므로 호출부가 넘긴다. 같은 자리로의 이동은 요청하지 않는다.
  */
  const moveNode = ({ clientId, parentClientId, position }: MoveNodeParams) => {
    if (treeId === null || isMovingNode) return;

    const { nodes, edges } = useTreeStore.getState();
    const movedNode = nodes.find((node) => node.id === clientId);
    const parentNode = nodes.find((node) => node.id === parentClientId);
    const placement = getNodePlacement(nodes, edges, clientId);

    if (!movedNode || !parentNode || !placement) return; // 루트는 형제가 없어 옮길 자리가 없다.

    if (
      placement.parentClientId === parentClientId &&
      placement.position === position
    ) {
      return;
    }

    const serverId = movedNode.data.serverId;
    const parentServerId = parentNode.data.serverId;

    if (serverId === null || parentServerId === null) {
      alert(UNSAVED_NODE_MESSAGE);
      return;
    }

    /*
    서버 응답을 기다리기 전에 editor store에 이동을 반영한다. 실패하면 위에서 읽어 둔 이동 전 nodes·edges로 구조를 되돌린다.
    */
    moveNodeInStore({ clientId, parentClientId, position });

    moveNodeOnServer(
      { treeId, nodeId: serverId, parentId: parentServerId, position },
      {
        /*
        서버와 같은 규칙으로 먼저 매겼으므로 보통은 바뀌는 것이 없다. 다른 탭의 편집으로 순서가 달랐을 때만 서버 순서로 맞춘다.
        undo는 옮기기 전 자리로, redo는 같은 목적지로 다시 옮긴다.
        */
        onSuccess: ({ siblings, previousSiblings }) => {
          applySiblingOrderInStore([siblings, previousSiblings]);
          recordEdit({
            type: "move",
            clientId,
            from: placement,
            to: { parentClientId, position },
          });
        },
        onError: (error) => {
          restoreStructureInStore({ nodes, edges });
          alert(getMoveNodeErrorMessage(error));
        },
      },
    );
  };

  return {
    moveNode,
    isMovingNode,
  };
};
