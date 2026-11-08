import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeSelector } from "./ThemeSelector";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
  vi.unstubAllGlobals();
});

describe("ThemeSelector", () => {
  it("현재 테마만 선택되어 있다", () => {
    document.documentElement.dataset.theme = "soft";

    render(<ThemeSelector />);

    expect(screen.getByRole("radio", { name: "Neutral" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Soft" })).toBeChecked();
  });

  it("시스템 설정을 고르면 OS 색상 모드에 맞는 테마를 적용하고 선택 표시를 옮긴다", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    document.documentElement.dataset.theme = "neutral";

    render(<ThemeSelector />);
    await user.click(screen.getByRole("radio", { name: "시스템 설정 따르기" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("twig-tree:theme")).toBe("system");
    expect(
      screen.getByRole("radio", { name: "시스템 설정 따르기" }),
    ).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked();
  });

  it("테마를 고르면 적용하고 저장하며 선택 표시를 옮긴다", async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = "neutral";

    render(<ThemeSelector />);
    await user.click(screen.getByRole("radio", { name: "Soft" }));

    expect(document.documentElement.dataset.theme).toBe("soft");
    expect(window.localStorage.getItem("twig-tree:theme")).toBe("soft");
    expect(screen.getByRole("radio", { name: "Soft" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Neutral" })).not.toBeChecked();
  });
});
