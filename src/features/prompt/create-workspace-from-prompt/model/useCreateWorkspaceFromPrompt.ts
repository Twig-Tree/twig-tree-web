"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { useCreateTreeFromPromptMutation } from "@/src/entities/tree";
import { getApiErrorMessage } from "@/src/shared/api/authErrorCodes";
import { isClientError } from "@/src/shared/api/httpErrors";
import { routes } from "@/src/shared/config/routes";

/*
응답을 받지 못했거나 서버가 5xx로 답했을 때 보여줄 문구.
서버의 5xx 문구는 무엇이 실패했는지만 알리고 다시 시도할지를 말해 주지 않아 여기서 덮는다.
*/
const CREATE_TREE_FAILURE_MESSAGE =
  "트리를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";

/*
함수 이름 : getCreateTreeErrorMessage
기능 : 트리 생성 요청이 실패한 원인을 사용자에게 보여줄 안내 문구로 바꾼다.
인자 : unknown error -> 트리 생성 요청이 reject한 오류
반환값 : 안내 문구

컨벤션 예외 : 이 프로젝트는 백엔드 에러 코드마다 프론트 문구를 두지만(getAddRootNodeErrorMessage),
이 요청의 4xx는 확장자 6종·파일 크기·본문 20,000자·지시문 500자처럼 제약값이 전부 백엔드 계약에서 온다.
같은 문구를 프론트에 복제하면 백엔드가 제약을 바꿀 때마다 따라가야 하고, 특히 본문 길이는
파일을 파싱하지 않는 프론트가 알 수 없는 값이다. 그래서 4xx만 서버 문구를 그대로 쓴다.
*/
const getCreateTreeErrorMessage = (error: unknown): string => {
  if (!isClientError(error)) {
    return CREATE_TREE_FAILURE_MESSAGE;
  }

  return getApiErrorMessage(error) ?? CREATE_TREE_FAILURE_MESSAGE;
};

/*
함수 이름 : useCreateWorkspaceFromPrompt
기능 : 프롬프트를 보내 워크스페이스·트리·노드를 만들고, 성공하면 만들어진 워크스페이스로 이동한다.
인자 : 없음
반환값 : 생성 핸들러와 생성 진행 상태

이동까지 이 hook이 맡는다. 목적지가 화면 사정이 아니라 방금 만든 워크스페이스로 정해져 있어,
이 유스케이스를 쓰는 화면이 늘어도 갈 곳은 같다. 위치를 화면이 정하는 useCreateWorkspace와 다른 점이다.

지시문과 파일을 따로 받고 PromptDraft를 받지 않는다. 입력 초안의 모양은 compose-prompt가 소유하므로
그 타입을 가져오면 같은 계층의 다른 슬라이스에 기대게 되고, 첨부를 배열로 관리한다는 입력 UI의 사정까지 알아야 한다.
여기서 필요한 것은 요청에 실을 값뿐이다.
*/
export function useCreateWorkspaceFromPrompt() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateTreeFromPromptMutation();

  /*
  연타로 워크스페이스가 두 개 만들어지지 않게 막는 동기 가드다. isPending은 렌더 시점 값이라
  리렌더 전에 들어온 다음 호출은 아직 false를 보고, 전송 버튼의 잠금도 같은 이유로 늦게 걸린다.
  이 요청은 중복돼도 서버가 거절하지 않고 워크스페이스를 하나 더 만들기 때문에 조용히 어긋난다.
  */
  const isSubmittingRef = useRef(false);

  const createWorkspaceFromPrompt = useCallback(
    async (message: string, file?: File): Promise<void> => {
      /*
      진행 중인 요청이 있으면 두 번째 호출은 보내지 않고 reject한다. resolve하면 호출부가
      성공으로 보고 입력을 비우는데, 첫 요청의 결과를 아직 모르는 시점이라 그 요청이 실패하면
      되돌릴 입력이 남지 않는다. 사용자가 할 일은 없으므로 안내는 하지 않는다.
      */
      if (isSubmittingRef.current) {
        throw new Error("Tree creation from prompt is already in progress.");
      }

      isSubmittingRef.current = true;

      try {
        const { workspaceId } = await mutateAsync({ message, file });

        router.push(routes.workspace(workspaceId));
      } catch (error) {
        /*
        실패하면 이동하지 않는다. 안내는 여기서 하고 오류는 다시 던진다.
        호출부(useComposePrompt)가 이 함수의 reject 여부로 입력을 비울지 판단하기 때문이다.
        */
        alert(getCreateTreeErrorMessage(error));
        console.error("Failed to create workspace from prompt", error);

        throw error;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [mutateAsync, router],
  );

  return {
    createWorkspaceFromPrompt,
    isCreatingWorkspaceFromPrompt: isPending,
  };
}
