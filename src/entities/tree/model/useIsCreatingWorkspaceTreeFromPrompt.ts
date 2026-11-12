import { useIsMutating } from "@tanstack/react-query";
import type { CreateWorkspaceTreeFromPromptVariables } from "./mutations/useCreateWorkspaceTreeFromPromptMutation";
import { treeQueryKeys } from "./queryKeys";

/*
함수 이름 : useIsCreatingWorkspaceTreeFromPrompt
기능 : 이 워크스페이스를 프롬프트로 채우는 요청이 진행 중인지 mutation cache에서 읽는다.
인자 : string workspaceId -> 확인할 워크스페이스 ID
반환값 : 진행 중이면 true

요청은 화면을 벗어나도 mutation cache에 남아 계속 진행된다. useMutation의 isPending은 그 hook이 보낸 요청만 알아서,
생성 중에 다른 페이지에 갔다 돌아오면 false가 되어 진행 표시가 사라지고 두 번째 요청을 보낼 수 있다.
그래서 진행 여부는 cache에서 읽는다. 키와 변수의 모양은 mutation을 정의한 이 slice가 알므로 여기에 둔다.
*/
export const useIsCreatingWorkspaceTreeFromPrompt = (workspaceId: string) =>
  useIsMutating({
    mutationKey: treeQueryKeys.createWorkspaceTreeFromPrompt(),
    predicate: (mutation) =>
      (
        mutation.state.variables as
          | CreateWorkspaceTreeFromPromptVariables
          | undefined
      )?.workspaceId === workspaceId,
  }) > 0;
