import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceQueryKeys } from "./queryKeys";
import { useInvalidateRecentWorkspaceList } from "./useInvalidateRecentWorkspaceList";

describe("useInvalidateRecentWorkspaceList", () => {
  /*
  두 화면이 페이지 크기를 키에 넣어 서로 다른 캐시를 쓰므로, 접두사로 무효화해야 둘 다 낡은 것으로 표시된다.
  */
  it("첫 페이지 캐시와 infinite 캐시를 함께 무효화하고 폴더 목록은 건드리지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.recentFirstPage(3), {});
    queryClient.setQueryData(workspaceQueryKeys.recentInfinite(20), {});
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);

    const { result } = renderHook(() => useInvalidateRecentWorkspaceList(), {
      wrapper,
    });

    await result.current();

    expect(
      queryClient.getQueryState(workspaceQueryKeys.recentFirstPage(3))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(workspaceQueryKeys.recentInfinite(20))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
        ?.isInvalidated,
    ).toBe(false);
  });

  /*
  호출부가 useCallback 의존성에 넣으므로, 다시 그려져도 같은 함수여야 핸들러가 매번 새로 만들어지지 않는다.
  */
  it("다시 그려져도 같은 함수를 돌려준다", () => {
    const { result, rerender } = renderHook(
      () => useInvalidateRecentWorkspaceList(),
      { wrapper: createQueryWrapper().wrapper },
    );
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
