import { TAG_ERROR_CODE, useRemoveNodeTagMutation } from "@/src/entities/tree";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { useTreeStore } from "../../treeStore";

type UseDetachNodeTagParams = {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  clientId: string | undefined; // 태그를 뗄 노드의 편집기 노드 ID, 선택된 노드가 없으면 undefined
  serverId: string | null; // 같은 노드의 서버 ID, 아직 저장 전이거나 선택된 노드가 없으면 null
};

/*
함수 이름 : useDetachNodeTag
기능 : 노드에서 태그 하나를 떼는 핸들러를 만든다. 트리 태그는 그대로 두고 노드와의 연결만 끊는다.
editor store에서 먼저 떼고 서버에 요청하며, 요청이 실패하면 같은 태그를 다시 붙여 되돌린다.
인자 : UseDetachNodeTagParams
반환값 : 노드 태그 연결 제거 핸들러
*/
export const useDetachNodeTag = ({
  treeId,
  clientId,
  serverId,
}: UseDetachNodeTagParams) => {
  const { mutateAsync: removeNodeTag } = useRemoveNodeTagMutation();
  const addTagToNodeInStore = useTreeStore(
    (state) => state.addTagToNodeInStore,
  );
  const removeTagFromNodeInStore = useTreeStore(
    (state) => state.removeTagFromNodeInStore,
  );

  const handleDetachNodeTag = async (tagId: string) => {
    if (!clientId) return;

    if (serverId === null) {
      alert("아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    removeTagFromNodeInStore(clientId, tagId);

    /*
    태그 store action은 history에 기록되지 않으므로 undo()가 아니라 그 태그만 다시 붙여 되돌린다.
    다시 붙인 태그는 원래 자리가 아니라 끝에 놓인다. 새로고침하면 서버 순서로 돌아온다.
    */
    try {
      await removeNodeTag({ treeId, nodeId: serverId, tagId });
    } catch (error) {
      if (getApiErrorCode(error) === TAG_ERROR_CODE.NODE_TAG_NOT_FOUND) return; // 서버에도 연결이 없으므로 화면과 같다.

      addTagToNodeInStore(clientId, tagId);
      alert("태그 제거에 실패했습니다.");
    }
  };

  return { handleDetachNodeTag };
};
