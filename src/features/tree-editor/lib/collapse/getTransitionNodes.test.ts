import { describe, it, expect } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import {
  addEnteringFrames,
  getNodeFrames,
  getTransitionEdges,
  getTransitionNodes,
  hasChangingNode,
} from "./getTransitionNodes";

const createNode = (clientId: string, x: number, y: number) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x,
    y,
  });

const createFrame = (x: number, y: number, opacity = 1) => ({
  position: { x, y },
  opacity,
});

describe("getTransitionNodes", () => {
  it("시작 좌표와 목표 좌표 사이를 진행률만큼 옮긴다", () => {
    const [node] = getTransitionNodes(
      [createNode("a", 100, 200)],
      new Map([["a", createFrame(0, 100)]]),
      0.25,
    );

    expect(node.position).toEqual({ x: 25, y: 125 });
    expect(node.style?.opacity).toBeUndefined();
  });

  it("투명하게 출발한 노드는 진행률만큼 드러난다", () => {
    const [node] = getTransitionNodes(
      [createNode("a", 100, 0)],
      new Map([["a", createFrame(0, 0, 0)]]),
      0.25,
    );

    expect(node.style?.opacity).toBe(0.25);
    expect(node.zIndex).toBe(-1);
  });

  it("중간에 멈춘 투명도에서 이어서 드러난다", () => {
    const [node] = getTransitionNodes(
      [createNode("a", 100, 0)],
      new Map([["a", createFrame(0, 0, 0.5)]]),
      0.5,
    );

    expect(node.style?.opacity).toBe(0.75);
  });

  it("시작 모습이 없거나 변하지 않는 노드는 객체를 그대로 재사용한다", () => {
    const appeared = createNode("a", 100, 200);
    const stayed = createNode("b", 0, 0);

    const result = getTransitionNodes(
      [appeared, stayed],
      new Map([["b", createFrame(0, 0)]]),
      0.5,
    );

    expect(result[0]).toBe(appeared);
    expect(result[1]).toBe(stayed);
  });
});

describe("getNodeFrames", () => {
  it("전환 중인 노드의 투명도를 읽고, 없으면 1로 본다", () => {
    const frames = getNodeFrames([
      { ...createNode("a", 1, 2), style: { opacity: 0.5 } },
      createNode("b", 3, 4),
    ]);

    expect(frames.get("a")).toEqual(createFrame(1, 2, 0.5));
    expect(frames.get("b")).toEqual(createFrame(3, 4));
  });
});

describe("addEnteringFrames", () => {
  /*
  r ── a ── b ── c
  */
  const nodes = [
    createNode("r", 0, 0),
    createNode("a", 100, 0),
    createNode("b", 200, 0),
    createNode("c", 300, 0),
  ];
  const edges = [
    createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
    createEditorEdge({ sourceClientId: "a", targetClientId: "b" }),
    createEditorEdge({ sourceClientId: "b", targetClientId: "c" }),
  ];

  it("새 노드는 이전 화면에 있던 가장 가까운 조상의 자리에서 투명하게 출발한다", () => {
    const frames = addEnteringFrames(
      nodes,
      edges,
      new Map([
        ["r", createFrame(0, 0)],
        ["a", createFrame(100, 50)],
      ]),
    );

    expect(frames.get("b")).toEqual(createFrame(100, 50, 0));
    expect(frames.get("c")).toEqual(createFrame(100, 50, 0));
  });

  it("이전 화면에 있던 노드의 모습은 그대로 둔다", () => {
    const frames = addEnteringFrames(
      nodes,
      edges,
      new Map([["a", createFrame(7, 7)]]),
    );

    expect(frames.get("a")).toEqual(createFrame(7, 7));
  });

  it("이전 화면에 조상이 없으면 더하지 않는다", () => {
    const frames = addEnteringFrames(nodes, edges, new Map());

    expect(frames.size).toBe(0);
  });
});

describe("hasChangingNode", () => {
  it("시작 좌표와 다른 노드가 있으면 true다", () => {
    expect(
      hasChangingNode(
        [createNode("a", 100, 0)],
        new Map([["a", createFrame(0, 0)]]),
      ),
    ).toBe(true);
  });

  it("좌표가 같아도 투명하게 출발하면 true다", () => {
    expect(
      hasChangingNode(
        [createNode("a", 0, 0)],
        new Map([["a", createFrame(0, 0, 0)]]),
      ),
    ).toBe(true);
  });

  it("시작 모습이 없는 노드만 있으면 false다", () => {
    expect(hasChangingNode([createNode("a", 100, 0)], new Map())).toBe(false);
  });
});

describe("getTransitionEdges", () => {
  const edge = createEditorEdge({ sourceClientId: "a", targetClientId: "b" });

  it("투명하게 출발한 노드로 들어가는 엣지는 같은 투명도가 된다", () => {
    const [result] = getTransitionEdges(
      [edge],
      new Map([["b", createFrame(0, 0, 0)]]),
      0.5,
    );

    expect(result.style?.opacity).toBe(0.5);
  });

  it("나머지 엣지는 객체를 그대로 재사용한다", () => {
    const [result] = getTransitionEdges(
      [edge],
      new Map([["b", createFrame(0, 0)]]),
      0.5,
    );

    expect(result).toBe(edge);
  });
});
