import { useCallback } from "react";
import {
  type TreeTag,
  useCreateTreeTagMutation,
  useDeleteTreeTagMutation,
  useGetTreeTagsQuery,
} from "@/src/entities/tree";
import { useTreeStore } from "../treeStore";

const EMPTY_TAGS: TreeTag[] = []; // 조회 전 렌더마다 새 배열이 되면 태그 목록에 의존하는 계산이 매번 다시 돈다.

/*
함수 이름 : useTreeTags
기능 : 지금 열린 트리의 태그 목록과, 트리 태그를 만들고 지우는 함수를 제공한다.
트리 ID는 editor store에서 읽으므로, 편집기가 초기화되기 전과 벗어난 뒤에는 조회하지 않는다.
태그 목록은 query cache가 원본이고, 만들기·지우기는 서버 응답을 받은 뒤에 cache에 반영된다.
이름 검증과 같은 이름 확인은 호출부가 먼저 한다. 노드에서 태그를 빼는 일은 트리 태그 삭제 action이 맡는다.
인자 : 없음
반환값 : 트리 태그 목록, 태그를 만들어 돌려주는 함수, 태그를 지우는 함수
*/
export const useTreeTags = () => {
  const treeId = useTreeStore((state) => state.treeId);
  const { data: tags = EMPTY_TAGS } = useGetTreeTagsQuery(treeId);
  const { mutateAsync: createTreeTag } = useCreateTreeTagMutation();
  const { mutateAsync: deleteTreeTag } = useDeleteTreeTagMutation();

  /*
  태그를 고르는 입력은 편집기 안에만 있어 treeId가 null일 때 호출되지 않는다. 호출되면 요청할 트리가 없으므로 실패로 돌려준다.
  */
  const createTag = useCallback(
    async (name: string): Promise<TreeTag> => {
      if (treeId === null) throw new Error("열린 트리가 없습니다.");

      return createTreeTag({ treeId, name: name.trim() });
    },
    [treeId, createTreeTag],
  );

  const deleteTag = useCallback(
    async (tagId: string): Promise<void> => {
      if (treeId === null) throw new Error("열린 트리가 없습니다.");

      await deleteTreeTag({ treeId, tagId });
    },
    [treeId, deleteTreeTag],
  );

  return { tags, createTag, deleteTag };
};
