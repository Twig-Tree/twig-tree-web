import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { server } from "@/src/tests/mocks/server";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useWithdraw } from "./useWithdraw";

const { mockReplace } = vi.hoisted(() => ({ mockReplace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

/*
탈퇴 요청에 돌려줄 응답을 끼우고, 요청이 몇 번 나갔는지 센다.
*/
const mockWithdrawResponse = (status: number) => {
  const requests = { count: 0 };

  server.use(
    http.delete("*/members/me", () => {
      requests.count += 1;

      return status === 200
        ? HttpResponse.json({
            isSuccess: true,
            code: "MEMBER200-2",
            message: "회원 탈퇴가 완료되었습니다.",
            data: null,
          })
        : HttpResponse.json(
            {
              isSuccess: false,
              code: "COMMON500",
              message: "서버 오류",
              data: null,
            },
            { status },
          );
    }),
  );

  return requests;
};

describe("useWithdraw", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    authSession.setTokens({ accessToken: "access-token" });
    vi.spyOn(console, "error").mockImplementation(() => undefined); // 실패 테스트가 남기는 오류 로그를 숨긴다.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("탈퇴에 성공하면 세션과 캐시를 비우고 로그인 화면으로 보낸다", async () => {
    const requests = mockWithdrawResponse(200);
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(["folder", "children", null], []);

    const { result } = renderHook(() => useWithdraw(), { wrapper });

    await act(() => result.current.withdraw());

    expect(requests.count).toBe(1);
    expect(authSession.hasAccessToken()).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  /*
  실패했는데 세션을 정리하면 사용자는 탈퇴된 줄 알지만 계정은 남아 있다.
  */
  it("탈퇴에 실패하면 세션을 유지하고 실패를 알린다", async () => {
    mockWithdrawResponse(500);
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(["folder", "children", null], []);

    const { result } = renderHook(() => useWithdraw(), { wrapper });

    await act(() => result.current.withdraw());

    await waitFor(() => expect(result.current.isWithdrawFailed).toBe(true));
    expect(authSession.hasAccessToken()).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
  });

  it("실패 상태를 초기화하면 실패 표시가 사라진다", async () => {
    mockWithdrawResponse(500);
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useWithdraw(), { wrapper });

    await act(() => result.current.withdraw());
    await waitFor(() => expect(result.current.isWithdrawFailed).toBe(true));

    act(() => result.current.resetWithdrawState());

    await waitFor(() => expect(result.current.isWithdrawFailed).toBe(false)); // TanStack Query는 상태 변경 알림을 다음 tick에 모아 보낸다.
  });
});
