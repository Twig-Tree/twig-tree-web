import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabTheme,
  getWorkspaceLabThemePalette,
  getWorkspaceLabThemeStyle,
  workspaceLabThemes,
} from "./themes";

describe("workspaceLabThemes", () => {
  it("테마 ID가 서로 겹치지 않는다", () => {
    const ids = workspaceLabThemes.map((theme) => theme.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(workspaceLabThemes)("$name의 토큰을 CSS 변수로 변환한다", (theme) => {
    const style = getWorkspaceLabThemeStyle(theme);

    expect(style["--lab-canvas"]).toBe(theme.tokens.canvas);
    expect(style["--lab-accent"]).toBe(theme.tokens.accent);
    expect(style["--lab-toolbar-surface"]).toBe(theme.tokens.toolbarSurface);
  });

  it("팔레트를 선택한 테마 토큰에서 만든다", () => {
    const theme = getWorkspaceLabTheme("quiet");

    expect(getWorkspaceLabThemePalette(theme)).toEqual([
      { label: "Canvas", color: theme.tokens.canvas },
      { label: "Surface", color: theme.tokens.surface },
      { label: "Ink", color: theme.tokens.text },
      { label: "Accent", color: theme.tokens.accent },
    ]);
  });
});
