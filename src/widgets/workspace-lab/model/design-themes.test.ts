import { describe, expect, it } from "vitest";
import { workspaceLabDefaultColorRoles } from "./color-roles";
import { workspaceLabConfigReducer, workspaceLabDefaultConfig } from "./config";
import {
  applyWorkspaceLabDesignTheme,
  isWorkspaceLabDesignThemeModified,
  workspaceLabDesignThemes,
} from "./design-themes";

describe("workspaceLabDesignThemes", () => {
  it("id가 중복되지 않는다", () => {
    const ids = workspaceLabDesignThemes.map((theme) => theme.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("기본 조합은 첫 디자인 테마와 같다", () => {
    expect(workspaceLabDefaultConfig.designTheme).toBe(
      workspaceLabDesignThemes[0].id,
    );
    expect(isWorkspaceLabDesignThemeModified(workspaceLabDefaultConfig)).toBe(
      false,
    );
  });
});

describe("applyWorkspaceLabDesignTheme", () => {
  it("테마가 정하는 스타일을 덮어쓰고 수정되지 않은 상태가 된다", () => {
    const next = applyWorkspaceLabDesignTheme(
      workspaceLabDefaultConfig,
      "contrast",
    );

    expect(next.designTheme).toBe("contrast");
    expect(next.colorTheme).toBe("contrast");
    expect(next.shapeStyle).toBe("hard");
    expect(next.leftPanelStyle.density).toBe("compact");
    expect(isWorkspaceLabDesignThemeModified(next)).toBe(false);
  });

  it("테마 밖의 항목과 패널 배치·너비는 유지한다", () => {
    const config = {
      ...workspaceLabDefaultConfig,
      scenarioId: "deep",
      viewport: "compact",
      showPlayer: true,
      leftPanelStyle: {
        ...workspaceLabDefaultConfig.leftPanelStyle,
        placement: "floating",
        width: "wide",
      },
    } as const;

    const next = applyWorkspaceLabDesignTheme(config, "soft");

    expect(next.scenarioId).toBe("deep");
    expect(next.viewport).toBe("compact");
    expect(next.showPlayer).toBe(true);
    expect(next.leftPanelStyle).toEqual({
      placement: "floating",
      width: "wide",
      surface: "muted",
      border: "shadow",
      density: "spacious",
    });
  });
});

describe("isWorkspaceLabDesignThemeModified", () => {
  it.each([
    ["단일 슬롯", { canvasStyle: "plain" }],
    [
      "색 역할",
      { colorRoles: { ...workspaceLabDefaultColorRoles, accent: "teal" } },
    ],
    [
      "연결선 속성",
      {
        edgeStyle: {
          ...workspaceLabDefaultConfig.edgeStyle,
          opacity: "faint",
        },
      },
    ],
    [
      "패널 표현",
      {
        memoPanelStyle: {
          ...workspaceLabDefaultConfig.memoPanelStyle,
          surface: "glass",
        },
      },
    ],
  ] as const)("%s을 바꾸면 수정됨으로 본다", (_, change) => {
    const next = workspaceLabConfigReducer(workspaceLabDefaultConfig, change);

    expect(isWorkspaceLabDesignThemeModified(next)).toBe(true);
  });

  it("테마 밖의 항목을 바꾸면 수정됨으로 보지 않는다", () => {
    const next = workspaceLabConfigReducer(workspaceLabDefaultConfig, {
      layoutMode: "horizontal",
      showToolbar: false,
      leftPanelStyle: {
        ...workspaceLabDefaultConfig.leftPanelStyle,
        width: "narrow",
      },
    });

    expect(isWorkspaceLabDesignThemeModified(next)).toBe(false);
  });
});

describe("workspaceLabConfigReducer · 디자인 테마", () => {
  it("같은 테마를 다시 고르면 수정한 값을 테마 값으로 되돌린다", () => {
    const modified = workspaceLabConfigReducer(workspaceLabDefaultConfig, {
      canvasStyle: "plain",
      shapeStyle: "hard",
    });

    const reset = workspaceLabConfigReducer(modified, { designTheme: "quiet" });

    expect(reset).toEqual(workspaceLabDefaultConfig);
  });
});
