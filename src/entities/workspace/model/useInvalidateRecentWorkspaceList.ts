import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { workspaceQueryKeys } from "./queryKeys";

/*
함수 이름 : useInvalidateRecentWorkspaceList
기능 : 최신순 워크스페이스 목록 캐시를 무효화하는 함수를 만든다.
인자 : 없음
반환값 : 최신순 목록 캐시를 무효화하는 함수. 목록이 화면에 떠 있으면 재조회가 끝날 때, 없으면 곧바로 resolve되는 Promise를 돌려준다

워크스페이스 밖의 변경이 최신순 목록을 낡게 할 때 쓴다. 폴더를 지우면 안의 워크스페이스도 DB에서 함께 지워지는 경우가 그렇다.
폴더는 워크스페이스의 부모라 entities/folder가 이 캐시를 직접 건드리면 순환 import가 생기므로,
캐시 키는 여기서 알고 호출 시점은 feature가 정한다(fsd-layers.md "Entity 사이의 의존 방향").

호출부가 useCallback 의존성에 넣을 수 있도록 참조를 유지한다.
*/
export function useInvalidateRecentWorkspaceList() {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.recent(),
      }),
    [queryClient],
  );
}
