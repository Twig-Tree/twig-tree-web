import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useGetWorkspaceListQuery, useGetWorkspaceQuery } from "./queries";

const renderWorkspaceListQuery = (folderId: string | null) =>
  renderHook(() => useGetWorkspaceListQuery(folderId), {
    wrapper: createQueryWrapper().wrapper,
  });

describe("useGetWorkspaceListQuery", () => {
  it("응답 DTO를 도메인 모델로 바꿔 돌려준다", async () => {
    const { result } = renderWorkspaceListQuery(null);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { id: "1", name: "Root Workspace", updatedAt: "2026-08-31T21:00:00" },
    ]);
  });

  /*
  핸들러가 folderId로 걸러 주므로, 파라미터가 빠지면 루트 목록이 돌아와 이 검사가 실패한다.
  */
  it("폴더 ID를 쿼리 파라미터로 실어 보낸다", async () => {
    const { result } = renderWorkspaceListQuery("3");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: "2",
        name: "Workspace In Folder",
        updatedAt: "2026-08-30T09:00:00",
      },
    ]);
  });

  /*
  Number(null)이 0이므로 null 확인이 숫자 변환보다 먼저여야 한다.
  순서가 뒤집히면 루트가 folderId=0으로 나가 이 검사가 실패한다.
  */
  it("루트는 folderId 없이 조회한다", async () => {
    const { result } = renderWorkspaceListQuery(null);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe("Root Workspace");
  });

  it("폴더 ID가 유효하지 않으면 요청하지 않는다", () => {
    const { result } = renderWorkspaceListQuery("NaN");

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("폴더 ID가 양의 정수가 아니면 요청하지 않는다", () => {
    expect(renderWorkspaceListQuery("0").result.current.fetchStatus).toBe(
      "idle",
    );
    expect(renderWorkspaceListQuery("-1").result.current.fetchStatus).toBe(
      "idle",
    );
    expect(renderWorkspaceListQuery("1.5").result.current.fetchStatus).toBe(
      "idle",
    );
  });
});

const renderWorkspaceQuery = (workspaceId: string) =>
  renderHook(() => useGetWorkspaceQuery(workspaceId), {
    wrapper: createQueryWrapper().wrapper,
  });

describe("useGetWorkspaceQuery", () => {
  it("응답 DTO를 treeId가 담긴 도메인 모델로 바꿔 돌려준다", async () => {
    const { result } = renderWorkspaceQuery("1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: "1",
      name: "Root Workspace",
      updatedAt: "2026-08-31T21:00:00",
      treeId: "10",
    });
  });

  it("트리가 없는 워크스페이스는 treeId가 null이다", async () => {
    const { result } = renderWorkspaceQuery("2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.treeId).toBeNull();
  });

  /*
  테스트 wrapper는 retry: false지만 이 query는 retry를 직접 지정해 그 설정을 덮는다.
  4xx에서 재시도하면 기본 지연(1초) 뒤에야 오류가 되어 failureCount가 2로 남는다.
  */
  it("없는 워크스페이스는 재시도 없이 오류가 된다", async () => {
    const { result } = renderWorkspaceQuery("999");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.failureCount).toBe(1);
  });
});
