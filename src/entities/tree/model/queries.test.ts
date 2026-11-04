import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { WORLD_GEOGRAPHY_NODE_IDS } from "@/src/entities/lecture";
import { useGetTreeQuery, useGetTreeTagsQuery } from "./queries";

describe("useGetTreeQuery", () => {
  it("세계 지리 강의 목 트리를 대본과 같은 서버 노드 ID로 조회한다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useGetTreeQuery("30"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(14);
    expect(result.current.data?.[0]).toMatchObject({
      id: WORLD_GEOGRAPHY_NODE_IDS.world,
      label: "세계",
      parentId: null,
    });
    expect(result.current.data?.at(-1)).toMatchObject({
      id: WORLD_GEOGRAPHY_NODE_IDS.yen,
      label: "엔",
      parentId: WORLD_GEOGRAPHY_NODE_IDS.japan,
    });
  });
});

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
