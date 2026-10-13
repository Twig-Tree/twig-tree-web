import { render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Directory" })).toHaveAttribute(
      "href",
      "/directory",
    );
    expect(screen.getByRole("link", { name: "Recent" })).toHaveAttribute(
      "href",
      "/recent",
    );
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("현재 경로의 링크만 현재 페이지로 표시한다", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Recent" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("하위 경로에서도 상위 아이템을 현재 페이지로 표시한다", () => {
    mockUsePathname.mockReturnValue("/directory/12");

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Directory" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
