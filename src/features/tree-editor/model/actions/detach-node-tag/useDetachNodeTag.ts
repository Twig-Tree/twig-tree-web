import { useTreeStore } from "../../treeStore";

type UseDetachNodeTagParams = {
  clientId: string | undefined; // 태그를 뗄 노드의 편집기 노드 ID, 선택된 노드가 없으면 undefined
};

/*
함수 이름 : useDetachNodeTag
기능 : 노드에서 태그 하나를 떼는 핸들러를 만든다. 트리 태그는 그대로 두고 노드와의 연결만 끊는다.
지금은 노드 태그 API가 없어 editor store만 바꾼다. API를 붙이면 요청이 실패했을 때 같은 태그를 다시 붙여 되돌린다.
인자 : UseDetachNodeTagParams
반환값 : 노드 태그 연결 제거 핸들러
*/
export const useDetachNodeTag = ({ clientId }: UseDetachNodeTagParams) => {
  const removeTagFromNodeInStore = useTreeStore(
    (state) => state.removeTagFromNodeInStore,
  );

  const handleDetachNodeTag = (tagId: string) => {
    if (!clientId) return;

    removeTagFromNodeInStore(clientId, tagId);
  };

  return { handleDetachNodeTag };
};
