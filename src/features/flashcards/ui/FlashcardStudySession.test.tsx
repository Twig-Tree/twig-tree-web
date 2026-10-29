import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renewableEnergyFlashcardScenario } from "../mock/sampleFlashcardScenarios";
import { getFlashcardReviewStorageKey } from "../lib/reviewStorage";
import { FlashcardStudySession } from "./FlashcardStudySession";

afterEach(() => window.localStorage.clear());

describe("FlashcardStudySession", () => {
  it("카드를 뒤집고 평가하면 다음 카드와 복습 기록을 보여준다", async () => {
    render(
      <FlashcardStudySession
        workspaceId="1"
        scenario={renewableEnergyFlashcardScenario}
      />,
    );

    const startButton = screen.getByRole("button", {
      name: /오늘 복습 6장 시작/,
    });
    await waitFor(() => expect(startButton).toBeEnabled());
    fireEvent.click(startButton);

    expect(
      screen.getByRole("heading", { name: "발전 변동성이란 무엇인가요?" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/날씨와 시간에 따라/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "답 보기" }));

    expect(screen.getByText(/날씨와 시간에 따라/)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "기억 상태 평가" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /기억함/ }));

    expect(
      screen.getByRole("heading", {
        name: "발전 변동성이 수요와 공급 균형을 어렵게 만드는 이유는?",
      }),
    ).toBeInTheDocument();
    expect(
      window.localStorage.getItem(
        getFlashcardReviewStorageKey("1", renewableEnergyFlashcardScenario.id),
      ),
    ).not.toBeNull();
  });

  it("마지막 카드를 평가하면 세션 결과를 보여준다", async () => {
    const oneCardScenario = {
      ...renewableEnergyFlashcardScenario,
      cards: [renewableEnergyFlashcardScenario.cards[0]],
    };

    render(
      <FlashcardStudySession workspaceId="1" scenario={oneCardScenario} />,
    );

    const startButton = screen.getByRole("button", {
      name: /오늘 복습 1장 시작/,
    });
    await waitFor(() => expect(startButton).toBeEnabled());
    fireEvent.click(startButton);
    fireEvent.click(screen.getByRole("button", { name: "답 보기" }));
    fireEvent.click(screen.getByRole("button", { name: /쉬움/ }));

    expect(
      screen.getByRole("heading", { name: "오늘 복습을 마쳤어요" }),
    ).toBeInTheDocument();
    expect(screen.getByText("복습 카드").previousSibling).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("기억함").previousSibling).toHaveTextContent("1");
  });
});
