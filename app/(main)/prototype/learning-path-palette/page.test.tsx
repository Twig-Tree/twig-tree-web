import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LearningPathPalettePage from "./page";

vi.mock("@/src/features/learning-path", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/src/features/learning-path")>();

  return {
    ...actual,
    LearningPathGraph: () => (
      <div aria-label="학습 경로 그래프 표본">학습 경로 그래프</div>
    ),
  };
});

describe("LearningPathPalettePage", () => {
  it("학습 경로 UI를 용도별 표본과 설명으로 보여준다", () => {
    render(<LearningPathPalettePage />);

    expect(
      screen.getByRole("heading", {
        name: /학습 경로를 이루는 조각과 그 조각이 필요한 이유/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "하나의 카드, 네 가지 상태" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "선은 포함 관계가 아니라 학습 순서를 말합니다",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "진행률은 핵심 경로만 계산합니다",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("progressbar", { name: "핵심 경로 진행률" }),
    ).toHaveLength(4);
  });

  it("패널 상태 표본을 탭으로 바꿔 확인할 수 있다", () => {
    render(<LearningPathPalettePage />);

    fireEvent.click(screen.getByRole("tab", { name: "잠긴 단계" }));

    expect(screen.getByRole("tab", { name: "잠긴 단계" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("잠긴 학습 단계")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /선수 단계로 이동/ }),
    ).toBeInTheDocument();
  });
});
