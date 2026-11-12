import { useMutation, useQueryClient } from "@tanstack/react-query";
import { folderApi } from "../../api/folderApi";
import type { MoveFolderRequest } from "../../api/types";
import { getApiFolderId } from "../../lib/folderId";
import { folderQueryKeys } from "../queryKeys";

interface MoveFolderVariables {
  folderId: string; // 옮길 폴더 ID
  fromParentId: string | null; // 지금 부모 폴더 ID. 요청에는 싣지 않고 목록 캐시를 찾는 데만 쓴다. 루트는 null
  toParentId: string | null; // 옮겨 갈 부모 폴더 ID. 루트는 null
}

/*
함수 이름 : useMoveFolderMutation
기능 : 폴더를 다른 부모 폴더 아래로 옮기고, 예전·새 부모의 하위 폴더 목록과 폴더 경로 캐시를 무효화한다.
인자 : 없음
반환값 : 폴더 이동 mutation
*/
export function useMoveFolderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, toParentId }: MoveFolderVariables) => {
      const request: MoveFolderRequest = {
        folderParentId: getApiFolderId(toParentId),
      };

      return folderApi.moveFolder(getApiFolderId(folderId), request);
    },
    onSuccess: (_movedFolder, variables) => {
      /*
      경로 캐시는 옮긴 폴더 하나가 아니라 전체를 무효화한다. 옮긴 폴더 아래의 모든 하위 폴더도
      상위 경로가 바뀌는데, 어떤 폴더가 그 아래에 있는지는 캐시만으로 알 수 없다.
      상세 캐시(FolderItem)는 부모 ID를 담지 않아 이동으로 바뀌지 않는다.
      */
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: folderQueryKeys.childrenByParent(variables.fromParentId),
        }),
        queryClient.invalidateQueries({
          queryKey: folderQueryKeys.childrenByParent(variables.toParentId),
        }),
        queryClient.invalidateQueries({
          queryKey: folderQueryKeys.paths(),
        }),
      ]);
    },
  });
}
