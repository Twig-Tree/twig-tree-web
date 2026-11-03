import { describe, it, expect } from "vitest";
import { createEditorNode } from "../add-node/createEditorNode";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getMovedElements } from "./getMovedElements";

const createNode = (clientId: string, orderIndex: number) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex,
    x: 0,
    y: 0,
  });

const createEdge = (sourceClientId: string, targetClientId: string) =>
  createEditorEdge({ sourceClientId, targetClientId });

/*
r 밑에 a, b, c, d가 있고 a 밑에 a1이 있다. 배열에서 a1은 a 바로 뒤에 있어 형제 사이에 다른 노드가 끼어 있다.
*/
const createTree = (orderIndexes = [1, 2, 3, 4]) => ({
  nodes: [
    createNode("r", 1),
    createNode("a", orderIndexes[0]),
    createNode("a1", 1),
    createNode("b", orderIndexes[1]),
    createNode("c", orderIndexes[2]),
    createNode("d", orderIndexes[3]),
  ],
  edges: [
    createEdge("r", "a"),
    createEdge("a", "a1"),
    createEdge("r", "b"),
    createEdge("r", "c"),
    createEdge("r", "d"),
  ],
});

/*
함수 이름 : getChildren
기능 : 부모의 자식을 화면에 놓이는 순서(노드 배열 순서)대로 "편집기 노드 ID:orderIndex" 문자열로 모은다.
인자 : { nodes, edges } elements -> 확인할 노드·엣지 배열
string parentClientId -> 자식을 모을 부모의 편집기 노드 ID
반환값 : 자식 목록 문자열 배열
*/
const getChildren = (
  { nodes, edges }: { nodes: CustomEditorNode[]; edges: CustomEditorEdge[] },
  parentClientId: string,
) => {
  const childClientIds = new Set(
    edges
      .filter((edge) => edge.source === parentClientId)
      .map((edge) => edge.target),
  );

  return nodes
    .filter((node) => childClientIds.has(node.id))
    .map((node) => `${node.id}:${node.data.orderIndex}`);
};

describe("getMovedElements", () => {
  it("같은 부모의 맨 앞으로 옮기면 그 자리에 놓고 형제를 1..n으로 다시 매긴다", () => {
    const tree = createTree();

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "d",
      parentClientId: "r",
      position: 1,
    });

    expect(getChildren(result, "r")).toEqual(["d:1", "a:2", "b:3", "c:4"]);
    expect(result.edges).toBe(tree.edges);
  });

  /*
  position은 옮길 노드를 뺀 형제 사이의 순번이다. a를 c 뒤에 놓으면 4가 아니라 3이다.
  */
  it("같은 부모에서 뒤로 옮길 때는 자기가 빠진 뒤의 순번에 놓는다", () => {
    const tree = createTree();

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "a",
      parentClientId: "r",
      position: 3,
    });

    expect(getChildren(result, "r")).toEqual(["b:1", "c:2", "a:3", "d:4"]);
  });

  it("같은 부모의 맨 끝으로 옮긴다", () => {
    const tree = createTree();

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "b",
      parentClientId: "r",
      position: 4,
    });

    expect(getChildren(result, "r")).toEqual(["a:1", "c:2", "d:3", "b:4"]);
  });

  it("다른 부모로 옮기면 엣지 source를 바꾸고 양쪽 형제를 다시 매긴다", () => {
    const tree = createTree();

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "b",
      parentClientId: "a",
      position: 2,
    });

    expect(getChildren(result, "a")).toEqual(["a1:1", "b:2"]);
    expect(getChildren(result, "r")).toEqual(["a:1", "c:2", "d:3"]);
    expect(result.edges.find((edge) => edge.target === "b")).toEqual({
      ...tree.edges[2],
      source: "a",
    });
  });

  it("자식이 없는 노드의 자식으로 옮긴다", () => {
    const tree = createTree();

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "c",
      parentClientId: "a1",
      position: 1,
    });

    expect(getChildren(result, "a1")).toEqual(["c:1"]);
    expect(getChildren(result, "r")).toEqual(["a:1", "b:2", "d:3"]);
  });

  it("하위 노드의 엣지는 그대로 두어 하위 트리가 함께 옮겨진다", () => {
    const tree = createTree();

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "a",
      parentClientId: "d",
      position: 1,
    });

    expect(getChildren(result, "d")).toEqual(["a:1"]);
    expect(getChildren(result, "a")).toEqual(["a1:1"]);
  });

  /*
  삭제로 생긴 빈 번호는 서버도 이동할 때 함께 정리하므로, 같은 규칙으로 매겨야 응답과 맞는다.
  */
  it("빈 번호가 있던 형제도 1..n으로 다시 매긴다", () => {
    const tree = createTree([1, 3, 4, 7]);

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "a",
      parentClientId: "r",
      position: 2,
    });

    expect(getChildren(result, "r")).toEqual(["b:1", "a:2", "c:3", "d:4"]);
  });

  it("orderIndex가 그대로인 노드는 같은 객체를 유지한다", () => {
    const tree = createTree();

    /*
    d를 c 앞으로 옮기면 r·a·a1·b의 orderIndex는 그대로다.
    */
    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "d",
      parentClientId: "r",
      position: 3,
    });

    result.nodes
      .slice(0, 4)
      .forEach((node, index) => expect(node).toBe(tree.nodes[index]));
    expect(getChildren(result, "r")).toEqual(["a:1", "b:2", "d:3", "c:4"]);
  });

  it("루트는 옮기지 않고 입력을 그대로 돌려준다", () => {
    const tree = createTree();

    const result = getMovedElements(tree.nodes, tree.edges, {
      clientId: "r",
      parentClientId: "a",
      position: 1,
    });

    expect(result.nodes).toBe(tree.nodes);
    expect(result.edges).toBe(tree.edges);
  });
});
