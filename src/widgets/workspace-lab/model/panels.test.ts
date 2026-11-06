import { describe, expect, it } from "vitest";
import {
  getWorkspaceLabPanelStyle,
  getWorkspaceLabPanelWidth,
  workspaceLabDefaultPanelStyle,
  workspaceLabPanelBorders,
  workspaceLabPanelDensities,
  workspaceLabPanelPlacements,
  workspaceLabPanelSurfaces,
  workspaceLabPanelWidths,
} from "./panels";

const slotCollections = [
  workspaceLabPanelPlacements,
  workspaceLabPanelWidths,
  workspaceLabPanelSurfaces,
  workspaceLabPanelBorders,
  workspaceLabPanelDensities,
];

describe("workspaceLab panel slots", () => {
  it("각 슬롯 안의 ID가 서로 겹치지 않는다", () => {
    for (const slots of slotCollections) {
      const ids = slots.map((slot) => slot.id);

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("너비 단계가 커질수록 두 패널 모두 넓어진다", () => {
    const [narrow, regular, wide] = ["narrow", "regular", "wide"].map((id) =>
      getWorkspaceLabPanelWidth(id as "narrow" | "regular" | "wide"),
    );

    for (const kind of ["sidebar", "memo"] as const) {
      expect(narrow[kind]).toBeLessThan(regular[kind]);
      expect(regular[kind]).toBeLessThan(wide[kind]);
    }
  });

  it("같은 선택값도 패널 종류에 따라 다른 너비로 해석한다", () => {
    expect(
      getWorkspaceLabPanelStyle("sidebar", workspaceLabDefaultPanelStyle),
    ).toMatchObject({ width: 208 });
    expect(
      getWorkspaceLabPanelStyle("memo", workspaceLabDefaultPanelStyle),
    ).toMatchObject({ width: 256 });
  });

  it("패널 밀도를 CSS 변수로 변환한다", () => {
    expect(
      getWorkspaceLabPanelStyle("sidebar", {
        ...workspaceLabDefaultPanelStyle,
        density: "compact",
      }),
    ).toMatchObject({
      "--lab-panel-padding": "8px",
      "--lab-panel-item-padding-y": "4px",
      "--lab-panel-font-size": "11px",
    });
  });
});
