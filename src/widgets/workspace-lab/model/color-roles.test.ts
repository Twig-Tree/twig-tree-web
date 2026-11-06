import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabColorTokens,
  workspaceLabAccentColors,
  workspaceLabChromeColors,
  workspaceLabColorContrasts,
  workspaceLabDefaultColorRoles,
  workspaceLabNeutralTones,
  workspaceLabRootColors,
  workspaceLabStatusColors,
} from "./color-roles";
import {
  getWorkspaceLabColorTheme,
  workspaceLabColorThemes,
} from "./color-themes";

const roleCollections = [
  workspaceLabNeutralTones,
  workspaceLabAccentColors,
  workspaceLabRootColors,
  workspaceLabStatusColors,
  workspaceLabChromeColors,
  workspaceLabColorContrasts,
];

const quietTokens = getWorkspaceLabColorTheme("quiet").tokens;

describe("workspaceLab color roles", () => {
  it("각 역할 안의 ID가 겹치지 않고 테마 기본으로 시작한다", () => {
    for (const options of roleCollections) {
      const ids = options.map((option) => option.id);

      expect(new Set(ids).size).toBe(ids.length);
      expect(ids[0]).toBe("theme");
    }
  });

  it("모든 역할이 테마 기본이면 어느 테마든 토큰을 바꾸지 않는다", () => {
    for (const theme of workspaceLabColorThemes) {
      expect(
        getWorkspaceLabColorTokens(theme.tokens, workspaceLabDefaultColorRoles),
      ).toEqual(theme.tokens);
    }
  });

  it("강조색은 이전 강조색을 쓰던 토큰을 함께 바꾼다", () => {
    const tokens = getWorkspaceLabColorTokens(quietTokens, {
      ...workspaceLabDefaultColorRoles,
      accent: "teal",
    });

    expect(quietTokens.rootControlSurface).toBe(quietTokens.accent);
    expect(tokens.accent).toBe("#0d9488");
    expect(tokens.rootControlSurface).toBe("#0d9488");
  });

  it("뒤의 역할은 앞에서 고른 색을 따라간다", () => {
    const tokens = getWorkspaceLabColorTokens(quietTokens, {
      ...workspaceLabDefaultColorRoles,
      accent: "rose",
      root: "accent",
    });

    expect(tokens.rootSurface).toBe("#e11d48");
  });

  it("중립 톤을 바꿔도 강조색과 루트는 테마 값을 유지한다", () => {
    const tokens = getWorkspaceLabColorTokens(quietTokens, {
      ...workspaceLabDefaultColorRoles,
      neutral: "stone",
    });

    expect(tokens.canvas).toBe("#f7f6f4");
    expect(tokens.accent).toBe(quietTokens.accent);
    expect(tokens.rootSurface).toBe(quietTokens.rootSurface);
  });
});
