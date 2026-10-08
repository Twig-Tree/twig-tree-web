import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { treeApi } from "../../api/treeApi";
import { treeQueryKeys } from "../queryKeys";

/*
함수 이름 : useCreateTreeFromPromptMutation
기능 : 프롬프트로 워크스페이스·트리·노드를 만들고, 응답에 담겨 온 노드로 트리 캐시를 확정한다.
인자 : 없음
반환값 : 프롬프트 트리 생성 mutation. 성공 데이터는 워크스페이스 ID, 트리 ID, 노드 목록

이 mutation은 트리 캐시뿐 아니라 워크스페이스 목록 캐시도 건드리므로 entities/workspace의 query key를 가져온다.
트리는 워크스페이스의 자식이라 이 방향의 import는 허용된다(fsd-layers.md "Entity 사이의 의존 방향").
*/
export const useCreateTreeFromPromptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: treeApi.createTreeFromPrompt,

    onSuccess: ({ treeId, nodes }) => {
      /*
      응답에 노드가 전부 담겨 오므로 워크스페이스로 이동한 뒤 트리를 다시 조회하지 않는다.
      useGetTreeQuery와 같은 키·같은 모양이라 그대로 읽히고, staleTime이 60초라 mount 직후 배경 재조회도 나가지 않는다.
      */
      queryClient.setQueryData(treeQueryKeys.detail(treeId), nodes);

      /*
      백엔드가 새 워크스페이스를 항상 루트에 만들므로 폴더별 목록은 루트 것만 낡는다.
      응답에 folderId가 없지만 위치가 확정되어 있어 무효화 대상을 좁힐 수 있다.
      최신순 목록은 폴더를 가리지 않으므로 함께 낡는다.
      */
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.listByFolder(null),
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.recent(),
        }),
      ]);
    },
  });
};
