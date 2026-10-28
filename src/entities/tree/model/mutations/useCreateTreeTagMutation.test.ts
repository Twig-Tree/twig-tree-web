import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { treeQueryKeys } from "../queryKeys";
import { TAG_ERROR_CODE } from "../constants";
import { useCreateTreeTagMutation } from "./useCreateTreeTagMutation";

describe("useCreateTreeTagMutation", () => {
  it("서버가 확정한 태그를 트리 태그 목록 캐시 끝에 덧붙인다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.tags("10"), [
      { id: "1", name: "React" },
    ]);
    const { result } = renderHook(() => useCreateTreeTagMutation(), {
      wrapper,
    });

    result.current.mutate({ treeId: "10", name: "Next.js" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ id: "600", name: "Next.js" });
    expect(queryClient.getQueryData(treeQueryKeys.tags("10"))).toEqual([
      { id: "1", name: "React" },
      { id: "600", name: "Next.js" },
    ]);
  });

  it("같은 이름이 있으면 TAG409-1로 거절되고 캐시는 그대로다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.tags("10"), []);
    const { result } = renderHook(() => useCreateTreeTagMutation(), {
      wrapper,
    });

    result.current.mutate({ treeId: "10", name: "React" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getApiErrorCode(result.current.error)).toBe(
      TAG_ERROR_CODE.DUPLICATE_TAG_NAME,
    );
    expect(queryClient.getQueryData(treeQueryKeys.tags("10"))).toEqual([]);
  });
});
