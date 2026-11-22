import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sidebar } from "./Sidebar";

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

describe("Sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("아이콘만 보이는 링크도 라벨을 이름으로 갖는다", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "대시보드" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "폴더" })).toHaveAttribute(
      "href",
      "/directory",
    );
    expect(screen.getByRole("link", { name: "최근 항목" })).toHaveAttribute(
      "href",
      "/recent",
    );
    expect(screen.getByRole("link", { name: "설정" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("현재 경로의 링크만 현재 페이지로 표시한다", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "대시보드" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "최근 항목" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("하위 경로에서도 상위 아이템을 현재 페이지로 표시한다", () => {
    mockUsePathname.mockReturnValue("/directory/12");

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "폴더" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "대시보드" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("설정 링크는 페이지 이동 링크와 다른 메뉴 묶음에 있다", () => {
    render(<Sidebar />);

    const accountNav = screen.getByRole("navigation", { name: "계정 메뉴" });

    expect(
      within(accountNav).getByRole("link", { name: "설정" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).queryByRole(
        "link",
        { name: "설정" },
      ),
    ).not.toBeInTheDocument();
  });

  it("설정 페이지에서는 설정 링크를 현재 페이지로 표시한다", () => {
    mockUsePathname.mockReturnValue("/settings");

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "설정" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "대시보드" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
