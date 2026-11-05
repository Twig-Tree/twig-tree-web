import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabColorTheme,
  getWorkspaceLabColorThemePalette,
  getWorkspaceLabColorThemeStyle,
  workspaceLabColorThemes,
} from "./color-themes";

describe("workspaceLabColorThemes", () => {
  it("테마 ID가 서로 겹치지 않는다", () => {
    const ids = workspaceLabColorThemes.map((theme) => theme.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(workspaceLabColorThemes)(
    "$name의 토큰을 CSS 변수로 변환한다",
    (theme) => {
      const style = getWorkspaceLabColorThemeStyle(theme);

      expect(style["--lab-canvas"]).toBe(theme.tokens.canvas);
      expect(style["--lab-accent"]).toBe(theme.tokens.accent);
      expect(style["--lab-toolbar-surface"]).toBe(theme.tokens.toolbarSurface);
    },
  );

  it("팔레트를 선택한 테마 토큰에서 만든다", () => {
    const theme = getWorkspaceLabColorTheme("quiet");

    expect(getWorkspaceLabColorThemePalette(theme)).toEqual([
      { label: "Canvas", color: theme.tokens.canvas },
      { label: "Surface", color: theme.tokens.surface },
      { label: "Ink", color: theme.tokens.text },
      { label: "Accent", color: theme.tokens.accent },
      { label: "Root", color: theme.tokens.rootSurface },
    ]);
  });
});
