import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceQueryKeys } from "./queryKeys";
import { useInvalidateRecentWorkspaceList } from "./useInvalidateRecentWorkspaceList";

describe("useInvalidateRecentWorkspaceList", () => {
  it("최신순 목록 캐시만 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.recent(), []);
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);

    const { result } = renderHook(() => useInvalidateRecentWorkspaceList(), {
      wrapper,
    });

    await result.current();

    expect(
      queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
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
