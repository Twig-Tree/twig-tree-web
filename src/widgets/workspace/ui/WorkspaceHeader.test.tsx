import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WorkspaceHeader } from "./WorkspaceHeader";

describe("WorkspaceHeader", () => {
  it("워크스페이스 이름을 제목으로 보여준다", () => {
    render(<WorkspaceHeader name="기획 회의" />);

    expect(
      screen.getByRole("heading", { name: "기획 회의" }),
    ).toBeInTheDocument();
  });

  it("이름을 불러오는 중에는 이름 대신 안내만 읽힌다", () => {
    render(<WorkspaceHeader name={undefined} isNameLoading />);

    expect(
      screen.getByRole("heading", {
        name: "워크스페이스 이름을 불러오는 중입니다.",
      }),
    ).toBeInTheDocument();
  });
});
