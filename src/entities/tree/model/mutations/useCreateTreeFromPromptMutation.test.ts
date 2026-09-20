import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { treeQueryKeys } from "../queryKeys";
import { useCreateTreeFromPromptMutation } from "./useCreateTreeFromPromptMutation";

describe("useCreateTreeFromPromptMutation", () => {
  it("서버가 확정한 워크스페이스·트리 ID와 노드를 돌려준다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.workspaceId).toBe("31");
    expect(result.current.data?.treeId).toBe("30");
    expect(result.current.data?.nodes).toHaveLength(2);
  });

  /*
  응답에 노드가 전부 담겨 오므로 워크스페이스로 이동한 뒤 트리를 다시 조회하지 않아야 한다.
  useGetTreeQuery가 읽는 키와 모양이 같은지 확인한다.
  */
  it("응답의 노드를 트리 캐시에 넣는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(treeQueryKeys.detail("30"))).toEqual([
      {
        id: "40",
        parentId: null,
        label: "컴퓨터 사이언스",
        orderIndex: 1,
        memo: "전공 기초",
      },
      {
        id: "41",
        parentId: "40",
        label: "자료구조",
        orderIndex: 1,
        memo: null,
      },
    ]);
  });

  it("루트 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);

    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
          ?.isInvalidated,
      ).toBe(true),
    );
  });

  /*
  새 워크스페이스는 항상 루트에 생기므로 폴더 안 목록까지 다시 조회할 이유가 없다.
  */
  it("폴더 안 워크스페이스 목록 캐시는 건드리지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder("3"), []);

    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder("3"))
        ?.isInvalidated,
    ).toBe(false);
  });
});
