import { describe, it, expect } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import { hasVisibleNodeChange } from "./hasVisibleNodeChange";

const createNode = (clientId: string, serverId: string | null) =>
  createEditorNode({
    clientId,
    serverId,
    label: clientId,
    orderIndex: 1,
    x: 0,
    y: 0,
  });

/*
r ─ a ─ b
*/
const edges = [
  createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
  createEditorEdge({ sourceClientId: "a", targetClientId: "b" }),
];
const r = createNode("r", "s-r");
const a = createNode("a", "s-a");
const b = createNode("b", "s-b");

describe("hasVisibleNodeChange", () => {
  it("접혀서 숨겨지는 노드가 생기면 달라진다", () => {
    expect(
      hasVisibleNodeChange({
        nodes: [r, a, b],
        edges,
        visibleNodes: [r, a, b],
        expandedDepth: 1,
      }),
    ).toBe(true);
  });

  it("숨겨져 있던 노드가 나타나면 달라진다", () => {
    expect(
      hasVisibleNodeChange({
        nodes: [r, a, b],
        edges,
        visibleNodes: [r],
        expandedDepth: 1,
      }),
    ).toBe(true);
  });

  it("이미 그 깊이까지만 보이면 그대로다", () => {
    expect(
      hasVisibleNodeChange({
        nodes: [r, a, b],
        edges,
        visibleNodes: [r, a],
        expandedDepth: 1,
      }),
    ).toBe(false);
  });

  /*
  삭제를 되돌리는 동안에는 되살린 하위 트리의 부모도 서버 ID가 없어 접히지 않는다.
  */
  it("접을 부모에 서버 ID가 없으면 그대로다", () => {
    const unsavedA = createNode("a", null);
    const unsavedB = createNode("b", null);

    expect(
      hasVisibleNodeChange({
        nodes: [r, unsavedA, unsavedB],
        edges,
        visibleNodes: [r, unsavedA, unsavedB],
        expandedDepth: 1,
      }),
    ).toBe(false);
  });

  it("보이는 수가 같아도 보이는 노드가 바뀌면 달라진다", () => {
    expect(
      hasVisibleNodeChange({
        nodes: [r, a, b],
        edges,
        visibleNodes: [r, b],
        expandedDepth: 1,
      }),
    ).toBe(true);
  });
});
