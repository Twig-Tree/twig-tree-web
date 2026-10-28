import { useRef } from "react";
import {
  MAX_NODE_TAG_COUNT,
  TAG_ERROR_CODE,
  type TreeTag,
  useAddNodeTagMutation,
} from "@/src/entities/tree";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { findTagByName } from "../../../lib/tag/findTagByName";
import { validateTagName } from "../../../lib/tag/validateTagName";
import { useTreeTags } from "../../tag/useTreeTags";
import { useTreeStore } from "../../treeStore";

type UseAttachNodeTagParams = {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  clientId: string | undefined; // 태그를 붙일 노드의 편집기 노드 ID, 선택된 노드가 없으면 undefined
  serverId: string | null; // 같은 노드의 서버 ID, 아직 저장 전이거나 선택된 노드가 없으면 null
  attachedTagIds: string[]; // 그 노드에 이미 붙은 태그 ID 목록
};

const TAG_LIMIT_MESSAGE = `태그는 노드당 최대 ${MAX_NODE_TAG_COUNT}개까지 붙일 수 있습니다.`;
const UNSAVED_NODE_MESSAGE =
  "아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.";
const CREATING_TAG_MESSAGE =
  "태그를 만드는 중입니다. 잠시 후 다시 시도해주세요.";
const ATTACH_FAILED_MESSAGE = "태그 추가에 실패했습니다.";

/*
함수 이름 : useAttachNodeTag
기능 : 노드에 트리 태그를 붙이는 함수를 만든다. 자동완성에서 고른 태그는 그대로 붙이고, 입력한 이름은 같은 이름의 트리 태그가 있으면 그것을,
없으면 트리 태그를 서버에 만든 뒤 붙인다. 붙이기는 editor store에 먼저 반영하고 서버 요청이 실패하면 그 태그만 떼어 되돌린다.
이름 길이, 노드당 개수 상한, 저장 전 노드처럼 요청 전에 거를 수 있는 것은 안내 문구로 돌려주고, 서버 실패는 알림으로 알린다.
인자 : UseAttachNodeTagParams
반환값 : 고른 태그를 붙이는 함수, 이름으로 태그를 붙이는 함수, 더 붙일 수 있는 태그 개수, 개수 상한 안내 문구
*/
export const useAttachNodeTag = ({
  treeId,
  clientId,
  serverId,
  attachedTagIds,
}: UseAttachNodeTagParams) => {
  const { tags, refetchTags, createTag } = useTreeTags();
  const { mutateAsync: addNodeTag } = useAddNodeTagMutation();
  const addTagToNodeInStore = useTreeStore(
    (state) => state.addTagToNodeInStore,
  );
  const removeTagFromNodeInStore = useTreeStore(
    (state) => state.removeTagFromNodeInStore,
  );

  /*
  같은 이름으로 연달아 만들면 두 번째 요청이 TAG409-1로 거절된다. pending 값은 리렌더 전의 연타를 막지 못하므로 동기 가드를 둔다.
  */
  const isCreatingTagRef = useRef(false);

  const remainingTagCount = Math.max(
    MAX_NODE_TAG_COUNT - attachedTagIds.length,
    0,
  );

  /*
  태그를 editor store에 먼저 붙이고 서버에 연결을 요청한다. 노드 ID는 호출 시점의 값을 받아, 응답 전에 선택이 바뀌어도 처음 노드를 되돌린다.
  태그 store action은 history에 기록되지 않으므로 undo()가 아니라 그 태그만 떼어 되돌린다.
  */
  const connectTagToNode = async (
    tagId: string,
    nodeClientId: string,
    nodeServerId: string,
  ) => {
    addTagToNodeInStore(nodeClientId, tagId);

    try {
      await addNodeTag({ treeId, nodeId: nodeServerId, tagId });
    } catch (error) {
      const code = getApiErrorCode(error);

      if (code === TAG_ERROR_CODE.DUPLICATE_NODE_TAG) return; // 서버에는 이미 붙어 있으므로 화면과 같다.

      removeTagFromNodeInStore(nodeClientId, tagId);
      alert(
        code === TAG_ERROR_CODE.NODE_TAG_COUNT_EXCEEDED
          ? TAG_LIMIT_MESSAGE
          : ATTACH_FAILED_MESSAGE,
      );
    }
  };

  /*
  트리 태그를 만든다. 이미 있다는 거절(TAG409-1)은 다른 곳에서 먼저 만든 태그가 cache에 없다는 뜻이므로, 목록을 다시 받아 그 태그를 쓴다.
  */
  const createOrFindTag = async (name: string): Promise<TreeTag | null> => {
    try {
      return await createTag(name);
    } catch (error) {
      if (getApiErrorCode(error) !== TAG_ERROR_CODE.DUPLICATE_TAG_NAME) {
        return null;
      }

      return findTagByName(await refetchTags(), name) ?? null;
    }
  };

  /*
  자동완성에서 고른 기존 트리 태그를 붙인다. 자동완성은 이미 붙은 태그를 보여 주지 않으므로 중복 안내가 필요 없다.
  */
  const attachTag = (tagId: string): string | null => {
    if (!clientId) return null;

    if (serverId === null) return UNSAVED_NODE_MESSAGE;

    if (remainingTagCount === 0) return TAG_LIMIT_MESSAGE;

    void connectTagToNode(tagId, clientId, serverId);

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

    if (serverId === null) return UNSAVED_NODE_MESSAGE;

    if (remainingTagCount === 0) return TAG_LIMIT_MESSAGE;

    if (existingTag) {
      void connectTagToNode(existingTag.id, clientId, serverId);

      return null;
    }

    if (isCreatingTagRef.current) return CREATING_TAG_MESSAGE;

    isCreatingTagRef.current = true;

    /*
    새 태그는 서버가 ID를 정해야 붙일 수 있으므로 생성 응답을 받은 뒤에 노드에 붙인다.
    입력 단계의 검증은 위에서 끝났으므로 입력창은 바로 비운다. 생성 뒤 연결만 실패하면 태그는 트리에 남아 다시 고를 수 있다.
    */
    void (async () => {
      try {
        const tag = await createOrFindTag(name);

        if (!tag) {
          alert(ATTACH_FAILED_MESSAGE);
          return;
        }

        await connectTagToNode(tag.id, clientId, serverId);
      } finally {
        isCreatingTagRef.current = false;
      }
    })();

    return null;
  };

  return {
    attachTag,
    attachTagByName,
    remainingTagCount,
    tagLimitMessage: TAG_LIMIT_MESSAGE,
  };
};
