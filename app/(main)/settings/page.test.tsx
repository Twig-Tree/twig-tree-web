import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import SettingsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

/*
회원 탈퇴 영역이 탈퇴 mutation을 쓰므로 QueryClient 안에서 그린다.
*/
const renderSettingsPage = () => {
  const { wrapper } = createQueryWrapper();

  render(<SettingsPage />, { wrapper });
};

/*
구독 해제가 음성 합성 API를 부르므로, stub을 걷기 전에 먼저 해제한다.
*/
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SettingsPage", () => {
  it("화면·연출·음성·안내·회원 탈퇴 섹션을 보여 준다", () => {
    renderSettingsPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "설정" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "화면" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "연출" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "음성" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "안내" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "회원 탈퇴" }),
    ).toBeInTheDocument();
  });

  it("안내 섹션에서 닫은 안내를 다시 볼 수 있다", () => {
    renderSettingsPage();

    expect(
      within(screen.getByRole("region", { name: "안내" })).getByRole("button", {
        name: "안내 다시 보기",
      }),
    ).toBeInTheDocument();
  });

  it("화면 섹션에서 테마를 고를 수 있다", () => {
    renderSettingsPage();

    expect(screen.getByRole("group", { name: "테마" })).toBeInTheDocument();
  });

  it("한국어 음성이 있으면 음성 섹션에서 음성을 고를 수 있다", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", class {});
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [{ name: "Yuna", lang: "ko-KR", voiceURI: "yuna" }],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderSettingsPage();

    expect(
      within(screen.getByRole("region", { name: "음성" })).getByRole(
        "combobox",
        { name: "음성" },
      ),
    ).toBeInTheDocument();
  });

  it("한국어 음성이 없으면 음성 섹션에 안내를 보여 준다", () => {
    renderSettingsPage();

    expect(
      within(screen.getByRole("region", { name: "음성" })).getByText(
        /한국어 음성이 없어/,
      ),
    ).toBeInTheDocument();
  });
});
