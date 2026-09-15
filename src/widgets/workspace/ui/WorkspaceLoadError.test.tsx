import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { WorkspaceLoadError } from "./WorkspaceLoadError";

describe("WorkspaceLoadError", () => {
  it("찾을 수 없는 워크스페이스면 대시보드로 가는 링크를 보여준다", () => {
    render(<WorkspaceLoadError isNotFound onRetry={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "워크스페이스를 찾을 수 없습니다" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "대시보드로 이동" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.queryByRole("button", { name: "다시 시도" }),
    ).not.toBeInTheDocument();
  });

  it("그 외 오류면 다시 시도 버튼으로 onRetry를 호출한다", async () => {
    const onRetry = vi.fn();
    render(<WorkspaceLoadError isNotFound={false} onRetry={onRetry} />);

    expect(
      screen.getByRole("heading", {
        name: "워크스페이스를 불러오지 못했습니다",
      }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
