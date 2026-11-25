import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { ProfileMenu } from "./ProfileMenu";

const { mockLogout, mockUseGetMyInfoQuery } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockUseGetMyInfoQuery: vi.fn(),
}));

vi.mock("@/src/features/auth/logout", () => ({
  useLogout: () => ({ logout: mockLogout, isLoggingOut: false }),
}));

vi.mock("@/src/entities/auth", () => ({
  useGetMyInfoQuery: mockUseGetMyInfoQuery,
}));

const openMenu = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "프로필 메뉴" }));

  return user;
};

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.spyOn(authSession, "hasAccessToken").mockReturnValue(true);
    mockUseGetMyInfoQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: "1",
        email: "twig@example.com",
        name: "트윅",
        profileImage: "",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockLogout.mockClear();
  });

  it("로그아웃을 고르면 로그아웃을 실행한다", async () => {
    render(<ProfileMenu />);

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "로그아웃" }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("메뉴를 열면 내 이름과 이메일을 보여 준다", async () => {
    render(<ProfileMenu />);

    await openMenu();

    expect(screen.getByText("트윅")).toBeInTheDocument();
    expect(screen.getByText("twig@example.com")).toBeInTheDocument();
  });

  it("내 정보를 불러오지 못하면 안내하고 로그아웃은 그대로 할 수 있다", async () => {
    mockUseGetMyInfoQuery.mockReturnValue({ isPending: false, isError: true });

    render(<ProfileMenu />);

    const user = await openMenu();

    expect(
      screen.getByText("내 정보를 불러오지 못했습니다."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "로그아웃" }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("로그인하지 않았으면 그리지 않는다", () => {
    vi.spyOn(authSession, "hasAccessToken").mockReturnValue(false);

    render(<ProfileMenu />);

    expect(
      screen.queryByRole("button", { name: "프로필 메뉴" }),
    ).not.toBeInTheDocument();
  });
});
