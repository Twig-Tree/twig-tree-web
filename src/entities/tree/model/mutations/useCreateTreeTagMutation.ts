import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagApi } from "@/src/entities/tree/api/tagApi";
import { TreeTag } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface CreateTreeTagVariables {
  treeId: string; // 태그를 만들 트리 ID
  name: string; // 새 태그 이름. 앞뒤 공백 정리와 중복 확인은 호출부가 먼저 한다
}

/*
함수 이름 : useCreateTreeTagMutation
기능 : 트리 태그 생성 API 요청을 수행하고, 서버가 확정한 태그를 트리 태그 목록 캐시 끝에 덧붙인다.
인자 : 없음
반환값 : 트리 태그 생성 mutation 객체
*/
export const useCreateTreeTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treeId, name }: CreateTreeTagVariables) =>
      tagApi.createTreeTag(Number(treeId), { name }),

    /*
    화면이 트리 태그 목록을 이 캐시에서 그리므로, 태그 ID가 확정된 응답으로만 갱신한다.
    */
    onSuccess: (createdTag, { treeId }) => {
      queryClient.setQueryData<TreeTag[]>(
        treeQueryKeys.tags(treeId),
        (oldTags) => (oldTags ? [...oldTags, createdTag] : oldTags),
      );
    },
  });
};
