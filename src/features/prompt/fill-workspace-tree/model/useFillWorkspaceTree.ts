"use client";

import { useCallback, useRef } from "react";
import {
  TREE_REQUEST_ERROR_CODE,
  useCreateWorkspaceTreeFromPromptMutation,
  useIsCreatingWorkspaceTreeFromPrompt,
} from "@/src/entities/tree";
import {
  getApiErrorCode,
  getApiErrorMessage,
} from "@/src/shared/api/authErrorCodes";
import { isClientError } from "@/src/shared/api/httpErrors";

interface UseFillWorkspaceTreeParams {
  workspaceId: string; // 채울 워크스페이스 ID. 라우트 파라미터라 페이지가 형식을 검사한 값이다
}

/*
응답을 받지 못했거나 서버가 5xx로 답했을 때 보여줄 문구. useCreateWorkspaceFromPrompt와 같은 이유로 서버 문구를 덮는다.
*/
const FILL_TREE_FAILURE_MESSAGE =
  "트리를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";

/*
다른 곳에서 먼저 트리를 채운 경우의 문구. 서버 문구는 "비어 있는 워크스페이스에만" 만들 수 있다는 규칙을 말하지만,
사용자는 빈 화면에서 요청했으므로 무엇이 바뀌었고 이제 무엇이 보일지를 알린다. mutation이 그 트리를 다시 받는다.
*/
const WORKSPACE_TREE_NOT_EMPTY_MESSAGE =
  "다른 곳에서 이미 트리를 만들었습니다. 만들어진 트리를 불러옵니다.";

/*
함수 이름 : getFillTreeErrorMessage
기능 : 워크스페이스 트리 채우기 요청이 실패한 원인을 사용자에게 보여줄 안내 문구로 바꾼다.
인자 : unknown error -> 트리 채우기 요청이 reject한 오류
반환값 : 안내 문구

4xx는 서버 문구를 그대로 쓴다. 제약값이 백엔드 계약에서 오는 이유는 useCreateWorkspaceFromPrompt의 getCreateTreeErrorMessage와 같다.
CHAT409-1만 분기하는 이유는 위 WORKSPACE_TREE_NOT_EMPTY_MESSAGE를 참고한다.
*/
const getFillTreeErrorMessage = (error: unknown): string => {
  if (
    getApiErrorCode(error) === TREE_REQUEST_ERROR_CODE.WORKSPACE_TREE_NOT_EMPTY
  ) {
    return WORKSPACE_TREE_NOT_EMPTY_MESSAGE;
  }

  if (!isClientError(error)) {
    return FILL_TREE_FAILURE_MESSAGE;
  }

  return getApiErrorMessage(error) ?? FILL_TREE_FAILURE_MESSAGE;
};

/*
함수 이름 : useFillWorkspaceTree
기능 : 프롬프트를 보내 노드가 없는 워크스페이스를 트리로 채운다. 실패하면 원인을 안내한다.
인자 : UseFillWorkspaceTreeParams
반환값 : 채우기 핸들러와 채우기 진행 상태

화면 이동이 없다. 채워진 트리는 mutation이 갱신한 캐시를 따라 지금 편집기에 그려진다.
지시문과 파일을 따로 받는 이유는 useCreateWorkspaceFromPrompt와 같다. 입력 초안의 모양은 compose-prompt가 소유한다.
*/
export function useFillWorkspaceTree({
  workspaceId,
}: UseFillWorkspaceTreeParams) {
  const { mutateAsync, isPending } = useCreateWorkspaceTreeFromPromptMutation();

  /*
  생성 중에 다른 페이지에 갔다 돌아오면 이 hook은 새로 만들어져 isPending과 아래 가드가 처음 값으로 돌아간다.
  요청은 그대로 진행 중이므로, 진행 표시와 중복 전송 판단은 mutation cache의 값도 함께 본다.
  */
  const isCreatingInCache = useIsCreatingWorkspaceTreeFromPrompt(workspaceId);
  const isFillingWorkspaceTree = isPending || isCreatingInCache;

  /*
  연타로 요청이 두 번 나가지 않게 막는 동기 가드다. isFillingWorkspaceTree는 렌더 시점 값이라 리렌더 전에 들어온 다음 호출은
  아직 false를 본다. 서버가 두 번째 요청을 409로 거절하더라도 LLM 응답을 기다린 뒤라, 그동안 과금과 대기가 겹친다.
  */
  const isSubmittingRef = useRef(false);

  const fillWorkspaceTree = useCallback(
    async (message: string, file?: File): Promise<void> => {
      /*
      진행 중이면 reject한다. resolve하면 호출부(useComposePrompt)가 성공으로 보고 입력을 비운다.
      */
      if (isSubmittingRef.current || isFillingWorkspaceTree) {
        throw new Error("Workspace tree filling is already in progress.");
      }

      isSubmittingRef.current = true;

      try {
        await mutateAsync({ workspaceId, message, file });
      } catch (error) {
        /*
        안내는 여기서 하고 오류는 다시 던진다. 호출부가 reject 여부로 입력을 남길지 판단한다.
        */
        alert(getFillTreeErrorMessage(error));
        console.error("Failed to fill workspace tree from prompt", error);

        throw error;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [mutateAsync, workspaceId, isFillingWorkspaceTree],
  );

  return {
    fillWorkspaceTree,
    isFillingWorkspaceTree,
  };
}
