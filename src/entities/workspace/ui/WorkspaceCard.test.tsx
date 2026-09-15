import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WorkspaceCard } from "./WorkspaceCard";

describe("WorkspaceCard", () => {
  it("카드를 누르면 해당 워크스페이스로 이동하는 링크를 제공한다", () => {
    render(
      <WorkspaceCard
        workspace={{
          id: "2",
          name: "리서치",
          updatedAt: "2026-08-31T21:00:00",
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "리서치 워크스페이스 열기" }),
    ).toHaveAttribute("href", "/workspace/2");
  });
});
