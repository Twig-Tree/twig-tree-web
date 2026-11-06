import { describe, expect, it } from "vitest";
import { workspaceLabDefaultColorRoles } from "./color-roles";
import { workspaceLabConfigReducer, workspaceLabDefaultConfig } from "./config";

const modifiedConfig = workspaceLabConfigReducer(workspaceLabDefaultConfig, {
  colorRoles: { ...workspaceLabDefaultColorRoles, accent: "teal" },
});

describe("workspaceLabConfigReducer", () => {
  it("바뀐 필드만 합치고 나머지는 유지한다", () => {
    const next = workspaceLabConfigReducer(workspaceLabDefaultConfig, {
      nodeShape: "circle",
    });

    expect(next).toEqual({ ...workspaceLabDefaultConfig, nodeShape: "circle" });
  });

  it("테마를 바꾸면 색 역할을 테마 기본으로 되돌린다", () => {
    const next = workspaceLabConfigReducer(modifiedConfig, {
      colorTheme: "soft",
    });

    expect(next.colorTheme).toBe("soft");
    expect(next.colorRoles).toEqual(workspaceLabDefaultColorRoles);
  });

  it("같은 테마를 다시 고르면 색 역할을 유지한다", () => {
    const next = workspaceLabConfigReducer(modifiedConfig, {
      colorTheme: modifiedConfig.colorTheme,
    });

    expect(next.colorRoles.accent).toBe("teal");
  });

  it("테마와 색 역할을 함께 넘기면 넘긴 색 역할을 쓴다", () => {
    const next = workspaceLabConfigReducer(modifiedConfig, {
      colorTheme: "soft",
      colorRoles: { ...workspaceLabDefaultColorRoles, accent: "rose" },
    });

    expect(next.colorRoles.accent).toBe("rose");
  });
});
