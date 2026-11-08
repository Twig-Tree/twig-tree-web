import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SettingsPage from "./page";

describe("SettingsPage", () => {
  it("화면·연출·음성 섹션을 보여 준다", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "설정" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "화면" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "연출" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "음성" })).toBeInTheDocument();
  });

  it("화면 섹션에서 테마를 고를 수 있다", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("group", { name: "테마" })).toBeInTheDocument();
  });

  it("음성 섹션에 음성 설정을 보여 준다", () => {
    render(<SettingsPage />);

    expect(
      within(screen.getByRole("region", { name: "음성" })).getByText(
        /한국어 음성이 없어/,
      ),
    ).toBeInTheDocument();
  });
});
