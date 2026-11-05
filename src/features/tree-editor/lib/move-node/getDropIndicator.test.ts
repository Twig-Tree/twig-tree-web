import { describe, it, expect } from "vitest";
import { createEditorNode } from "../add-node/createEditorNode";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { CustomEditorNode } from "../../model/types";
import { DropTarget } from "./getDropTarget";
import { getDropIndicator } from "./getDropIndicator";

/*
그려진 노드는 100×40이다.
*/
const createNode = (clientId: string, x: number, y: number) => ({
  ...createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x,
    y,
  }),
  measured: { width: 100, height: 40 },
});

/*
r(0,100) ─┬─ a(230,0)   ── a1(460,0)
          ├─ b(230,100)
          └─ c(230,200)
*/
const nodes: CustomEditorNode[] = [
  createNode("r", 0, 100),
  createNode("a", 230, 0),
  createNode("a1", 460, 0),
  createNode("b", 230, 100),
  createNode("c", 230, 200),
];
const edges = [
  createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
  createEditorEdge({ sourceClientId: "a", targetClientId: "a1" }),
  createEditorEdge({ sourceClientId: "r", targetClientId: "b" }),
  createEditorEdge({ sourceClientId: "r", targetClientId: "c" }),
];

const getIndicator = (dropTarget: DropTarget, draggedClientId: string) =>
  getDropIndicator(dropTarget, draggedClientId, nodes, edges);

describe("getDropIndicator", () => {
  it("이웃 형제 앞에 놓으면 두 노드 사이 빈칸의 가운데에 기준 노드 폭의 삽입선을 둔다", () => {
    expect(
      getIndicator(
        {
          clientId: "a1",
          parentClientId: "r",
          position: 2,
          kind: "before",
          anchorClientId: "b",
        },
        "a1",
      ),
    ).toEqual({ kind: "line", rect: { x: 230, y: 68, width: 100, height: 4 } });
  });

  it("앞에 이웃이 없으면 기준 노드 위로 간격의 절반만큼 띄운다", () => {
    expect(
      getIndicator(
        {
          clientId: "a1",
          parentClientId: "r",
          position: 1,
          kind: "before",
          anchorClientId: "a",
        },
        "a1",
      ),
    ).toEqual({
      kind: "line",
      rect: { x: 230, y: -18, width: 100, height: 4 },
    });
  });

  /*
  끄는 노드 c는 빠질 자리라 b의 뒤 이웃으로 보지 않는다.
  */
  it("끄는 노드는 이웃으로 보지 않는다", () => {
    expect(
      getIndicator(
        {
          clientId: "c",
          parentClientId: "r",
          position: 3,
          kind: "after",
          anchorClientId: "b",
        },
        "c",
      ),
    ).toEqual({
      kind: "line",
      rect: { x: 230, y: 154, width: 100, height: 4 },
    });
  });

  it("자식으로 놓으면 기준 노드를 둘러싼 강조 상자를 둔다", () => {
    expect(
      getIndicator(
        {
          clientId: "c",
          parentClientId: "a",
          position: 2,
          kind: "child",
          anchorClientId: "a",
        },
        "c",
      ),
    ).toEqual({
      kind: "anchor",
      rect: { x: 224, y: -6, width: 112, height: 52 },
    });
  });
});
