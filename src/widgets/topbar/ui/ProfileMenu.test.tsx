import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { ProfileMenu } from "./ProfileMenu";

const { mockPush, mockReplace, mockLogout } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockLogout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/src/features/auth/logout", () => ({
  useLogout: () => ({ logout: mockLogout, isLoggingOut: false }),
}));

/*
탈퇴 요청에 돌려줄 상태 코드를 정하고, 요청이 몇 번 나갔는지 센다.
*/
const mockWithdrawResponse = (status: number) => {
  const requests = { count: 0 };

  server.use(
    http.delete("*/members/me", () => {
      requests.count += 1;

      return HttpResponse.json(
        { isSuccess: status === 200, code: "TEST", message: "", data: null },
        { status },
      );
    }),
  );

  return requests;
};

const renderProfileMenu = () => {
  const { wrapper } = createQueryWrapper();

  render(<ProfileMenu />, { wrapper });
};

const openMenu = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "프로필 메뉴" }));

  return user;
};

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.spyOn(authSession, "hasAccessToken").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockLogout.mockClear();
  });

  it("설정을 고르면 설정 페이지로 이동한다", async () => {
    renderProfileMenu();

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "설정" }));

    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("로그아웃을 고르면 로그아웃을 실행한다", async () => {
    renderProfileMenu();

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "로그아웃" }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("로그인하지 않았으면 그리지 않는다", () => {
    vi.spyOn(authSession, "hasAccessToken").mockReturnValue(false);

    renderProfileMenu();

    expect(
      screen.queryByRole("button", { name: "프로필 메뉴" }),
    ).not.toBeInTheDocument();
  });

  it("회원 탈퇴를 고르면 확인 모달을 연다", async () => {
    renderProfileMenu();

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "회원 탈퇴" }));

    expect(
      screen.getByRole("dialog", { name: "회원 탈퇴" }),
    ).toBeInTheDocument();
  });

  it("확인 모달에서 탈퇴하기를 누르면 탈퇴하고 로그인 화면으로 보낸다", async () => {
    const requests = mockWithdrawResponse(200);
    renderProfileMenu();

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
    expect(requests.count).toBe(1);
  });

  it("확인 모달에서 취소하면 탈퇴를 요청하지 않는다", async () => {
    const requests = mockWithdrawResponse(200);
    renderProfileMenu();

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(
      screen.queryByRole("dialog", { name: "회원 탈퇴" }),
    ).not.toBeInTheDocument();
    expect(requests.count).toBe(0);
  });

  /*
  실패했는데 모달을 닫으면 사용자는 탈퇴된 줄 안다. 다시 열 때는 지난 실패 문구가 남지 않아야 한다.
  */
  it("탈퇴에 실패하면 모달에 안내하고, 다시 열면 안내를 지운다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined); // 실패가 남기는 오류 로그를 숨긴다.
    mockWithdrawResponse(500);
    renderProfileMenu();

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "탈퇴하지 못했습니다",
    );
    expect(mockReplace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "취소" }));
    await user.click(screen.getByRole("button", { name: "프로필 메뉴" }));
    await user.click(screen.getByRole("menuitem", { name: "회원 탈퇴" }));

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
});
