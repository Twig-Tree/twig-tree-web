import { MAX_NODE_TAG_COUNT } from "@/src/entities/tree";
import { findTagByName } from "../../../lib/tag/findTagByName";
import { validateTagName } from "../../../lib/tag/validateTagName";
import { useTreeTags } from "../../tag/useTreeTags";
import { useTreeStore } from "../../treeStore";

type UseAttachNodeTagParams = {
  clientId: string | undefined; // 태그를 붙일 노드의 편집기 노드 ID, 선택된 노드가 없으면 undefined
  attachedTagIds: string[]; // 그 노드에 이미 붙은 태그 ID 목록
};

const TAG_LIMIT_MESSAGE = `태그는 노드당 최대 ${MAX_NODE_TAG_COUNT}개까지 붙일 수 있습니다.`;

/*
함수 이름 : useAttachNodeTag
기능 : 노드에 트리 태그를 붙이는 함수를 만든다. 자동완성에서 고른 태그는 그대로 붙이고, 입력한 이름은 같은 이름의 트리 태그가 있으면 그것을,
없으면 트리 태그를 새로 만들어 붙인다. 이름 길이와 노드당 개수 상한은 요청 전에 걸러 안내 문구로 돌려준다.
지금은 태그 API가 없어 임시 트리 태그 store와 editor store만 바꾼다.
인자 : UseAttachNodeTagParams
반환값 : 고른 태그를 붙이는 함수, 이름으로 태그를 붙이는 함수, 더 붙일 수 있는 태그 개수, 개수 상한 안내 문구
*/
export const useAttachNodeTag = ({
  clientId,
  attachedTagIds,
}: UseAttachNodeTagParams) => {
  const { tags, createTag } = useTreeTags();
  const addTagToNodeInStore = useTreeStore(
    (state) => state.addTagToNodeInStore,
  );

  const remainingTagCount = Math.max(
    MAX_NODE_TAG_COUNT - attachedTagIds.length,
    0,
  );

  /*
  자동완성에서 고른 기존 트리 태그를 붙인다. 자동완성은 이미 붙은 태그를 보여 주지 않으므로 중복 안내가 필요 없다.
  */
  const attachTag = (tagId: string): string | null => {
    if (!clientId) return null;

    if (remainingTagCount === 0) return TAG_LIMIT_MESSAGE;

    addTagToNodeInStore(clientId, tagId);

    return null;
  };

  /*
  입력한 이름으로 태그를 붙인다. 같은 이름의 태그는 트리에 하나뿐이므로, 대소문자만 다른 이름도 새로 만들지 않고 기존 태그를 붙인다.
  */
  const attachTagByName = (name: string): string | null => {
    if (!clientId) return null;

    const nameError = validateTagName(name);
    if (nameError) return nameError;

    const existingTag = findTagByName(tags, name);

    if (existingTag && attachedTagIds.includes(existingTag.id)) {
      return "이미 붙은 태그입니다.";
    }

    if (remainingTagCount === 0) return TAG_LIMIT_MESSAGE;

    const tag = existingTag ?? createTag(name);

    addTagToNodeInStore(clientId, tag.id);

    return null;
  };

  return {
    attachTag,
    attachTagByName,
    remainingTagCount,
    tagLimitMessage: TAG_LIMIT_MESSAGE,
  };
};
