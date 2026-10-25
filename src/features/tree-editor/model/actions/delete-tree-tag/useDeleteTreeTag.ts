import { getTaggedNodeResults } from "../../../lib/tag/getTaggedNodeResults";
import { useTreeTags } from "../../tag/useTreeTags";
import { useTreeStore } from "../../treeStore";

/*
함수 이름 : useDeleteTreeTag
기능 : 트리 태그를 지우는 핸들러를 만든다. 지우면 그 태그가 붙은 모든 노드에서도 빠지므로, 붙은 노드 수를 알리고 확인을 받은 뒤에 지운다.
지금은 태그 API가 없어 임시 트리 태그 store와 editor store만 바꾼다. 백엔드는 트리 태그를 지우면 노드와의 연결도 함께 지운다.
인자 : 없음
반환값 : 트리 태그 삭제 핸들러
*/
export const useDeleteTreeTag = () => {
  const { tags, deleteTag } = useTreeTags();
  const removeTagFromAllNodesInStore = useTreeStore(
    (state) => state.removeTagFromAllNodesInStore,
  );

  const handleDeleteTreeTag = (tagId: string) => {
    const tag = tags.find((treeTag) => treeTag.id === tagId);
    if (!tag) return;

    /*
    붙은 노드 수는 확인 창을 띄우는 이 순간에만 필요하므로 구독하지 않고 store에서 바로 읽는다.
    */
    const taggedNodeCount = getTaggedNodeResults(
      useTreeStore.getState().nodes,
      tagId,
    ).length;

    const confirmMessage =
      taggedNodeCount > 0
        ? `"${tag.name}" 태그를 삭제하면 관련된 노드 ${taggedNodeCount}개에서도 제거됩니다.\n삭제하시겠습니까?`
        : `"${tag.name}" 태그를 삭제하시겠습니까?`;

    if (!window.confirm(confirmMessage)) return;

    /*
    트리 태그 목록에서 먼저 지운다. 노드의 tagIds에 잠시 남아 있어도 칩은 트리 태그 목록에 있는 태그만 그리므로 빈 칩이 생기지 않는다.
    */
    deleteTag(tagId);
    removeTagFromAllNodesInStore(tagId);
  };

  return { handleDeleteTreeTag };
};
