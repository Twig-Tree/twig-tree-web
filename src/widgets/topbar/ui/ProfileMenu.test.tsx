import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { ProfileMenu } from "./ProfileMenu";

const { mockPush, mockLogout } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockLogout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/src/features/auth/logout", () => ({
  useLogout: () => ({ logout: mockLogout, isLoggingOut: false }),
}));

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
    mockLogout.mockClear();
  });

  it("설정을 고르면 설정 페이지로 이동한다", async () => {
    render(<ProfileMenu />);

    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "설정" }));

    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("로그아웃을 고르면 로그아웃을 실행한다", async () => {
    render(<ProfileMenu />);

    const user = await openMenu();
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
