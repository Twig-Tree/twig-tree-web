import type { TreeTag } from "@/src/entities/tree";

/*
함수 이름 : getTagsByIds
기능 : 노드에 붙은 태그 ID 목록을 트리 태그로 바꾼다. 태그를 붙인 순서대로 칩을 그리도록 tagIds 순서를 따른다.
트리 태그 목록에 없는 ID는 건너뛴다. 트리 태그가 목록에서 먼저 지워지고 노드의 tagIds에는 아직 남아 있는 순간에도 빈 칩을 그리지 않는다.
인자 : TreeTag[] tags -> 트리 태그 목록
string[] tagIds -> 노드에 붙은 태그 ID 목록
반환값 : 노드에 붙은 트리 태그 목록
*/
export const getTagsByIds = (tags: TreeTag[], tagIds: string[]): TreeTag[] => {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));

  return tagIds.flatMap((tagId) => {
    const tag = tagById.get(tagId);

    return tag ? [tag] : [];
  });
};
