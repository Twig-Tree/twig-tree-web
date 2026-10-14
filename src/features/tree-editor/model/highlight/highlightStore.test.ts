import { afterEach, describe, it, expect } from "vitest";
import { useHighlightStore } from "./highlightStore";

describe("highlightStore", () => {
  afterEach(() => {
    useHighlightStore.getState().clearHighlight();
  });

  it("setHighlight는 강조 집합을 넘긴 노드들로 교체한다", () => {
    const { setHighlight } = useHighlightStore.getState();

    setHighlight(["c1", "c2"]);
    setHighlight(["c3"]);

    expect(useHighlightStore.getState().highlightedClientIds).toEqual(
      new Set(["c3"]),
    );
  });

  it("clearHighlight는 강조 집합을 비운다", () => {
    const { setHighlight, clearHighlight } = useHighlightStore.getState();

    setHighlight(["c1", "c2"]);
    clearHighlight();

    expect(useHighlightStore.getState().highlightedClientIds).toEqual(
      new Set(),
    );
  });
});
