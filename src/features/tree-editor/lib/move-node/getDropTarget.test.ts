import { describe, it, expect } from "vitest";
import { createEditorNode } from "../add-node/createEditorNode";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { CustomEditorNode } from "../../model/types";
import { getDropTarget } from "./getDropTarget";

const NODE_WIDTH = 100;
const NODE_HEIGHT = 40;

const createNode = (clientId: string, x: number, y: number) => ({
  ...createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x,
    y,
  }),
  measured: { width: NODE_WIDTH, height: NODE_HEIGHT },
});

/*
레이아웃 방향 RIGHT처럼 자식을 오른쪽 열에 세로로 쌓는다. 노드는 100×40이고 형제 사이는 위아래로 60 떨어져 있다.

r(0,100) ─┬─ a(200,0)   ── a1(400,0)
          ├─ b(200,100)
          └─ c(200,200) ── d(400,200)
*/
const nodes: CustomEditorNode[] = [
  createNode("r", 0, 100),
  createNode("a", 200, 0),
  createNode("a1", 400, 0),
  createNode("b", 200, 100),
  createNode("c", 200, 200),
  createNode("d", 400, 200),
];
const edges = [
  createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
  createEditorEdge({ sourceClientId: "a", targetClientId: "a1" }),
  createEditorEdge({ sourceClientId: "r", targetClientId: "b" }),
  createEditorEdge({ sourceClientId: "r", targetClientId: "c" }),
  createEditorEdge({ sourceClientId: "c", targetClientId: "d" }),
];

const dropAt = (
  draggedClientId: string,
  x: number,
  y: number,
  visibleNodes = nodes,
) =>
  getDropTarget({
    draggedClientId,
    point: { x, y },
    visibleNodes,
    nodes,
    edges,
  });

describe("getDropTarget", () => {
  it("노드의 위쪽 1/4에 놓으면 그 노드 바로 앞이다", () => {
    expect(dropAt("c", 250, 5)).toEqual({
      clientId: "c",
      parentClientId: "r",
      position: 1,
      kind: "before",
      anchorClientId: "a",
    });
  });

  /*
  a를 빼면 r의 자식은 b, c이므로 c 뒤는 3번째다.
  */
  it("노드의 아래쪽 1/4에 놓으면 그 노드 바로 뒤이고, 같은 부모면 자기가 빠진 순번으로 센다", () => {
    expect(dropAt("a", 250, 235)).toMatchObject({
      parentClientId: "r",
      position: 3,
      kind: "after",
      anchorClientId: "c",
    });
  });

  it("노드의 가운데에 놓으면 그 노드의 자식 맨 끝이다", () => {
    expect(dropAt("b", 250, 20)).toMatchObject({
      parentClientId: "a",
      position: 2,
      kind: "child",
      anchorClientId: "a",
    });
  });

  it("자식이 없는 노드의 가운데에 놓으면 첫 자식이 된다", () => {
    expect(dropAt("b", 450, 20)).toMatchObject({
      parentClientId: "a1",
      position: 1,
      kind: "child",
    });
  });

  it("다른 계층의 노드 앞에 놓으면 그 노드의 부모 밑으로 옮긴다", () => {
    expect(dropAt("b", 450, 203)).toMatchObject({
      parentClientId: "c",
      position: 1,
      kind: "before",
      anchorClientId: "d",
    });
  });

  it("형제 사이의 빈칸은 더 가까운 노드를 기준으로 정한다", () => {
    expect(dropAt("c", 250, 65)).toMatchObject({
      parentClientId: "r",
      position: 2,
      kind: "after",
      anchorClientId: "a",
    });
  });

  it("접혀 숨겨진 자식도 순번에 넣는다", () => {
    const visibleNodes = nodes.filter((node) => node.id !== "a1");

    expect(dropAt("b", 250, 20, visibleNodes)).toMatchObject({
      parentClientId: "a",
      position: 2,
    });
  });

  it("루트의 가운데에 놓으면 루트의 자식 맨 끝이다", () => {
    expect(dropAt("b", 50, 120)).toMatchObject({
      parentClientId: "r",
      position: 3,
      kind: "child",
    });
  });

  it("루트의 앞뒤에는 놓을 수 없다", () => {
    expect(dropAt("b", 50, 102)).toBeNull();
    expect(dropAt("b", 50, 138)).toBeNull();
  });

  it("자기 하위 노드 위에 놓으면 놓을 수 없다", () => {
    expect(dropAt("c", 450, 220)).toBeNull();
  });

  /*
  하위 노드 d 바로 아래 30 거리에 다른 노드 e가 있어, 후보에서만 빼면 e가 기준이 된다.
  */
  it("하위 노드 상자 안에 놓으면 근처에 다른 노드가 있어도 놓을 수 없다", () => {
    const nodesWithNeighbor = [...nodes, createNode("e", 400, 270)];

    expect(
      getDropTarget({
        draggedClientId: "c",
        point: { x: 450, y: 235 },
        visibleNodes: nodesWithNeighbor,
        nodes: nodesWithNeighbor,
        edges: [
          ...edges,
          createEditorEdge({ sourceClientId: "b", targetClientId: "e" }),
        ],
      }),
    ).toBeNull();
  });

  it("원래 자리와 같으면 null이다", () => {
    expect(dropAt("b", 250, 38)).toBeNull();
    expect(dropAt("b", 250, 202)).toBeNull();
  });

  it("가까운 노드가 없으면 null이다", () => {
    expect(dropAt("b", 1000, 1000)).toBeNull();
  });

  it("루트는 옮길 수 없다", () => {
    expect(dropAt("r", 250, 20)).toBeNull();
  });
});
