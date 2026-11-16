import {
  type QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { isRequestTimeout } from "@/src/shared/api/httpErrors";
import { markQueriesStale } from "@/src/shared/lib/react-query/markQueriesStale";
import { treeApi } from "../../api/treeApi";

/*
함수 이름 : useCreateTreeFromPromptMutation
기능 : 프롬프트로 워크스페이스·트리·노드를 만들고, 낡은 워크스페이스 목록 캐시를 무효화한다.
응답을 기다리다 프론트가 끊으면 서버가 뒤늦게 저장할 수 있어 같은 목록을 낡음으로만 표시한다.
인자 : 없음
반환값 : 프롬프트 트리 생성 mutation. 성공 데이터는 워크스페이스 ID, 트리 ID

응답의 노드는 트리 캐시에 넣지 않는다. 트리 조회 응답과 달리 version과 tagIds가 없어, 넣으면 그 노드의 이름·메모 저장이 version 없이 나간다.
트리 캐시는 이동한 화면의 트리 조회가 채운다.

이 mutation은 워크스페이스 목록 캐시를 건드리므로 entities/workspace의 query key를 가져온다.
트리는 워크스페이스의 자식이라 이 방향의 import는 허용된다(fsd-layers.md "Entity 사이의 의존 방향").
*/
export const useCreateTreeFromPromptMutation = () => {
  const queryClient = useQueryClient();

  /*
  백엔드가 새 워크스페이스를 항상 루트에 만들므로 폴더별 목록은 루트 것만 낡는다.
  응답에 folderId가 없지만 위치가 확정되어 있어 무효화 대상을 좁힐 수 있다.
  최신순 목록은 폴더를 가리지 않으므로 함께 낡는다.
  */
  const workspaceListFilters: QueryFilters[] = [
    { queryKey: workspaceQueryKeys.listByFolder(null) },
    { queryKey: workspaceQueryKeys.recent() },
  ];

  return useMutation({
    mutationFn: treeApi.createTreeFromPrompt,

    onSuccess: () =>
      Promise.all(
        workspaceListFilters.map((filter) =>
          queryClient.invalidateQueries(filter),
        ),
      ),

    onError: (error) => {
      if (!isRequestTimeout(error)) return;

      /*
      끊긴 시점에는 서버가 아직 저장 전일 가능성이 높아, 바로 다시 받으면 옛 목록이 새것으로 남는다.
      낡음만 표시해 창 포커스나 화면 재진입 때 다시 받게 한다.
      */
      return markQueriesStale(queryClient, workspaceListFilters);
    },
  });
};
