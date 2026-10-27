import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useGetTreeTagsQuery } from "./queries";

describe("useGetTreeTagsQuery", () => {
  it("트리 태그 ID를 문자열 도메인 모델로 돌려준다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useGetTreeTagsQuery("10"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { id: "1", name: "React" },
      { id: "2", name: "TypeScript" },
    ]);
  });

  it("트리가 없으면 조회하지 않는다", () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useGetTreeTagsQuery(null), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });
});
