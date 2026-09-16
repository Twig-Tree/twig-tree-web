import { useRef } from "react";
import { NODE_ERROR_CODE, useAddNodeMutation } from "@/src/entities/tree";
import {
  TREE_ERROR_CODE,
  useCreateWorkspaceTreeMutation,
  useSetWorkspaceTreeIdInCache,
} from "@/src/entities/workspace";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { ROOT_NODE_LABEL } from "../../../constants/node";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { createClientNodeId } from "../../../lib/createClientNodeId";
import { useTreeStore } from "../../treeStore";
import { CustomEditorNode } from "../../types";

interface UseAddRootNodeParams {
  workspaceId: string; // 트리가 없을 때 트리를 만들 워크스페이스 ID
  /*
  워크스페이스 상세 캐시의 treeId. 트리가 없으면 null이다.
  store의 treeId로 판단하지 않는다. 루트 생성이 실패해 캐시만 채워진 직후에는 store의 treeId가 아직 null이라,
  그 사이에 다시 누르면 트리를 또 만들려다 409가 난다.
  */
  treeId: string | null;
  nodes: CustomEditorNode[]; // 현재 editor store의 노드 목록. 비어 있을 때만 루트를 추가한다
}

const ROOT_ORDER_INDEX = 1; // 백엔드가 orderId를 1 이상으로 받으므로 첫 노드는 1이다

/*
함수 이름 : getAddRootNodeErrorMessage
기능 : 루트 노드 추가 흐름에서 받은 오류를 사용자에게 보여줄 안내 문구로 바꾼다.
인자 : unknown error -> 트리 생성 또는 루트 노드 생성 요청이 reject한 오류
반환값 : 안내 문구
*/
const getAddRootNodeErrorMessage = (error: unknown): string => {
  const code = getApiErrorCode(error);

  /*
  다른 곳에서 먼저 트리나 루트를 만든 경우다. 트리는 상세 캐시 무효화로 다음 시도가 이어지지만,
  루트는 store가 트리당 한 번만 채워지므로 새로고침해야 보인다.
  */
  if (code === TREE_ERROR_CODE.TREE_ALREADY_EXISTS) {
    return "이미 트리가 만들어진 워크스페이스입니다. 잠시 후 다시 시도해주세요.";
  }

  if (code === NODE_ERROR_CODE.ONE_ROOT_PER_TREE) {
    return "이미 루트 노드가 있습니다. 새로고침 후 다시 시도해주세요.";
  }

  return "노드 추가에 실패했습니다.";
};

/*
함수 이름 : useAddRootNode
기능 : 노드가 하나도 없는 트리에 루트 노드를 추가한다. 트리가 없는 워크스페이스는 트리를 먼저 만든다.
인자 : UseAddRootNodeParams
반환값 : 루트 노드 추가 핸들러와 루트 노드 추가 요청 상태

자식 노드 추가(useAddNode)와 달리 optimistic update를 하지 않는다. 캔버스가 비어 있어 먼저 그려서 얻는 이득이 작고,
트리까지 만드는 경우 요청이 둘이라 중간 실패 시 되돌릴 경로가 갈린다.
*/
export const useAddRootNode = ({
  workspaceId,
  treeId,
  nodes,
}: UseAddRootNodeParams) => {
  const initializeTree = useTreeStore((state) => state.initializeTree);
  const setWorkspaceTreeIdInCache = useSetWorkspaceTreeIdInCache();

  const {
    mutateAsync: createTreeOnServer,
    isPending: isCreatingTree,
    isError: isCreateTreeError,
  } = useCreateWorkspaceTreeMutation();

  const {
    mutateAsync: addNodeOnServer,
    isPending: isAddingNode,
    isError: isAddNodeError,
  } = useAddNodeMutation();

  const isAddingRootNode = isCreatingTree || isAddingNode;
  const isAddRootNodeError = isCreateTreeError || isAddNodeError;

  /*
  연타로 트리를 두 번 만들지 않기 위한 동기 가드다. isAddingRootNode는 렌더 시점 값이라
  리렌더 전에 들어온 다음 클릭은 아직 false를 보고, 버튼 disabled도 같은 이유로 늦게 걸린다.
  이 hook에서만 두는 이유는 중복 요청이 같은 대상(워크스페이스의 트리 하나)을 노려 409가 되기 때문이다.
  */
  const isSubmittingRef = useRef(false);

  /*
  트리당 루트는 하나라 노드가 이미 있으면 요청하지 않는다.
  */
  const handleAddRootNode = async () => {
    if (nodes.length > 0 || isAddingRootNode || isSubmittingRef.current) return;

    isSubmittingRef.current = true;

    try {
      let rootTreeId = treeId;
      const isNewTree = treeId === null; // 이번 흐름에서 트리를 새로 만들어 상세 캐시를 채워야 하는지 여부

      try {
        rootTreeId ??= await createTreeOnServer(workspaceId);
      } catch (error) {
        alert(getAddRootNodeErrorMessage(error));
        return;
      }

      try {
        const createdNode = await addNodeOnServer({
          treeId: rootTreeId,
          node: {
            parentId: null,
            orderId: ROOT_ORDER_INDEX,
            name: ROOT_NODE_LABEL,
          },
        });

        /*
        빈 store를 루트 하나로 초기화한다. treeId도 함께 채우므로, 뒤이어 상세 캐시가 바뀌어 트리 조회가 끝나도
        useInitializeTree가 같은 트리로 보고 건너뛴다. 들어오는 엣지가 없고 위치는 레이아웃이 계산한다.
        */
        initializeTree({
          treeId: rootTreeId,
          nodes: [
            createEditorNode({
              clientId: createClientNodeId(),
              serverId: createdNode.id,
              label: createdNode.label,
              orderIndex: createdNode.orderIndex,
              x: 0,
              y: 0,
            }),
          ],
          edges: [],
        });

        /*
        추가 직후 undo 기록을 비운다. undo는 서버와 연결되어 있지 않아, 되돌리면 서버에 루트가 남은 채 store만 비고
        버튼이 다시 루트 추가로 바뀌어 409가 난다. 루트는 지울 수 없으므로 트리 초기화처럼 편집의 시작점으로 둔다.
        */
        useTreeStore.temporal.getState().clear();
      } catch (error) {
        alert(getAddRootNodeErrorMessage(error));
      } finally {
        /*
        store 반영이 끝난 뒤에 상세 캐시를 채운다. 순서가 뒤집히면 트리 조회가 루트 생성과 겹쳐 루트가 두 번 들어갈 수 있다.
        루트 생성이 실패해도 트리는 생겼으므로 채운다. store에 루트가 없어 조회 결과로 채워져도 겹칠 노드가 없고,
        다음 시도는 트리를 다시 만들지 않고 루트 생성만 한다.
        */
        if (isNewTree) {
          setWorkspaceTreeIdInCache(workspaceId, rootTreeId);
        }
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return {
    handleAddRootNode,
    isAddingRootNode,
    isAddRootNodeError,
  };
};
