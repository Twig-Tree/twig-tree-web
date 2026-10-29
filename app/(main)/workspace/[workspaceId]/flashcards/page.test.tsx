import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it } from "vitest";
import FlashcardsPage from "./page";

const renderPage = async (workspaceId: string) => {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <FlashcardsPage params={Promise.resolve({ workspaceId })} />
      </Suspense>,
    );
  });
};

afterEach(() => window.localStorage.clear());

describe("FlashcardsPage", () => {
  it.each(["abc", "0", "1.5"])(
    "워크스페이스 ID 형식이 잘못되면(%s) 찾을 수 없다고 안내한다",
    async (workspaceId) => {
      await renderPage(workspaceId);

      expect(
        screen.getByRole("heading", {
          name: "워크스페이스를 찾을 수 없습니다",
        }),
      ).toBeInTheDocument();
    },
  );

  it("워크스페이스 ID에 맞는 플래시카드 덱을 표시한다", async () => {
    await renderPage("2");

    expect(
      screen.getByRole("heading", { name: "OSI 7계층 플래시카드" }),
    ).toBeInTheDocument();
    expect(screen.getByText("OSI 7계층")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /오늘 복습 8장 시작/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "플래시카드" })).toHaveAttribute(
      "href",
      "/workspace/2/flashcards",
    );
  });

  it("목 덱이 없는 워크스페이스에는 준비되지 않았다고 안내한다", async () => {
    await renderPage("99");

    expect(
      screen.getByRole("heading", { name: "아직 준비된 카드가 없습니다" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "트리로 돌아가기" }),
    ).toHaveAttribute("href", "/workspace/99");
  });
});
