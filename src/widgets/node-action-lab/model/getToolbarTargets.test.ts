import { describe, expect, it } from "vitest";
import { getToolbarTargets } from "./getToolbarTargets";

const base = {
  hoveredClientId: "h",
  selectedClientId: "s",
  renamingClientId: null,
};

describe("getToolbarTargets", () => {
  it("끄면 어느 노드에도 붙이지 않는다", () => {
    expect(getToolbarTargets({ ...base, visibility: "off" })).toEqual([]);
  });

  it("호버만 켜면 마우스가 올라간 노드에 붙인다", () => {
    expect(getToolbarTargets({ ...base, visibility: "hover" })).toEqual([
      { clientId: "h", entry: "hoverToolbar" },
    ]);
  });

  it("선택만 켜면 선택된 노드에 붙인다", () => {
    expect(getToolbarTargets({ ...base, visibility: "selected" })).toEqual([
      { clientId: "s", entry: "selectedToolbar" },
    ]);
  });

  it("둘 다 켜면 선택된 노드와 마우스가 올라간 노드에 각각 붙인다", () => {
    expect(
      getToolbarTargets({ ...base, visibility: "hoverOrSelected" }),
    ).toEqual([
      { clientId: "s", entry: "selectedToolbar" },
      { clientId: "h", entry: "hoverToolbar" },
    ]);
  });

  it("선택된 노드에 마우스가 올라가 있으면 선택 버튼 하나만 붙인다", () => {
    expect(
      getToolbarTargets({
        ...base,
        hoveredClientId: "s",
        visibility: "hoverOrSelected",
      }),
    ).toEqual([{ clientId: "s", entry: "selectedToolbar" }]);
  });

  it("이름 입력창이 열린 노드에는 붙이지 않는다", () => {
    expect(
      getToolbarTargets({
        ...base,
        renamingClientId: "s",
        visibility: "hoverOrSelected",
      }),
    ).toEqual([{ clientId: "h", entry: "hoverToolbar" }]);
  });
});
