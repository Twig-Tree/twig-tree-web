import { useCallback } from "react";
import type { TreeTag } from "@/src/entities/tree";
import { useTreeTagStore } from "./treeTagStore";

/*
함수 이름 : useTreeTags
기능 : 지금 열린 트리의 태그 목록과, 트리 태그를 만들고 지우는 함수를 제공한다.
지금은 트리 태그 API가 없어 임시 store에서 읽고 쓴다. API를 붙일 때는 이 hook의 내부만 바꾼다.
이름 검증과 같은 이름 확인은 호출부가 먼저 한다. 노드에서 태그를 빼는 일은 트리 태그 삭제 action이 맡는다.
인자 : 없음
반환값 : 트리 태그 목록, 태그를 만들어 돌려주는 함수, 태그를 지우는 함수
*/
export const useTreeTags = () => {
  const tags = useTreeTagStore((state) => state.tags);
  const addTag = useTreeTagStore((state) => state.addTag);
  const deleteTag = useTreeTagStore((state) => state.deleteTag);

  const createTag = useCallback(
    (name: string): TreeTag => {
      const tag = { id: crypto.randomUUID(), name: name.trim() }; // 서버가 없으므로 태그 ID를 프론트가 정한다.

      addTag(tag);

      return tag;
    },
    [addTag],
  );

  return { tags, createTag, deleteTag };
};
