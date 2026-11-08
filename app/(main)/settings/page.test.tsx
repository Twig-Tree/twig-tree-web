import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";

/*
구독 해제가 음성 합성 API를 부르므로, stub을 걷기 전에 먼저 해제한다.
*/
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

  it("한국어 음성이 있으면 음성 섹션에서 음성을 고를 수 있다", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", class {});
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [{ name: "Yuna", lang: "ko-KR", voiceURI: "yuna" }],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<SettingsPage />);

    expect(
      within(screen.getByRole("region", { name: "음성" })).getByRole(
        "combobox",
        { name: "음성" },
      ),
    ).toBeInTheDocument();
  });

  it("한국어 음성이 없으면 음성 섹션에 안내를 보여 준다", () => {
    render(<SettingsPage />);

    expect(
      within(screen.getByRole("region", { name: "음성" })).getByText(
        /한국어 음성이 없어/,
      ),
    ).toBeInTheDocument();
  });
});
