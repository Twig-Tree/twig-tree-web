import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useGetWorkspaceListQuery } from "./queries";

const renderWorkspaceListQuery = (folderId: string | null) =>
  renderHook(() => useGetWorkspaceListQuery(folderId), {
    wrapper: createQueryWrapper(),
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
