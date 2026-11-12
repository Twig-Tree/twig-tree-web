import { describe, expect, it } from "vitest";
import {
  DEFAULT_NODE_ACTION_LAB_CONFIG,
  getToolbarEntryKey,
  type NodeActionLabConfig,
} from "./config";

const createConfig = (
  patch: Partial<NodeActionLabConfig>,
): NodeActionLabConfig => ({ ...DEFAULT_NODE_ACTION_LAB_CONFIG, ...patch });

describe("getToolbarEntryKey", () => {
  it("선택된 노드에 버튼이 붙지 않으면 들어갈 키가 없다", () => {
    expect(
      getToolbarEntryKey(createConfig({ toolbarVisibility: "off" })),
    ).toBeNull();
    expect(
      getToolbarEntryKey(createConfig({ toolbarVisibility: "hover" })),
    ).toBeNull();
  });

  it("선택된 노드에 버튼이 붙으면 고른 키를 쓴다", () => {
    expect(
      getToolbarEntryKey(
        createConfig({ toolbarVisibility: "selected", toolbarEntryKey: "Tab" }),
      ),
    ).toBe("Tab");
    expect(
      getToolbarEntryKey(
        createConfig({
          toolbarVisibility: "hoverOrSelected",
          toolbarEntryKey: "ArrowDown",
        }),
      ),
    ).toBe("ArrowDown");
  });
});
