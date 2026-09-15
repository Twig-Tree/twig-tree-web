import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceQueryKeys } from "./queryKeys";
import { useSetWorkspaceTreeIdInCache } from "./useSetWorkspaceTreeIdInCache";

describe("useSetWorkspaceTreeIdInCache", () => {
  it("상세 캐시의 treeId만 바꾸고 나머지 필드는 유지한다", () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.detail("2"), {
      id: "2",
      name: "Workspace In Folder",
      updatedAt: "2026-08-30T09:00:00",
      treeId: null,
    });

    const { result } = renderHook(() => useSetWorkspaceTreeIdInCache(), {
      wrapper,
    });

    result.current("2", "20");

    expect(queryClient.getQueryData(workspaceQueryKeys.detail("2"))).toEqual({
      id: "2",
      name: "Workspace In Folder",
      updatedAt: "2026-08-30T09:00:00",
      treeId: "20",
    });
  });

  it("상세 캐시가 없으면 새로 만들지 않는다", () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSetWorkspaceTreeIdInCache(), {
      wrapper,
    });

    result.current("2", "20");

    expect(
      queryClient.getQueryData(workspaceQueryKeys.detail("2")),
    ).toBeUndefined();
  });
});
