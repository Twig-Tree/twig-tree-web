import { describe, it, expect } from "vitest";
import { TreeNode } from "@/src/entities/tree";
import { createEditorNode } from "../add-node/createEditorNode";
import { getNodesInServerSiblingOrder } from "./getNodesInServerSiblingOrder";

const createNode = (clientId: string, orderIndex: number) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex,
    x: 0,
    y: 0,
  });

const createServerNode = (
  clientId: string,
  parentClientId: string,
  orderIndex: number,
): TreeNode => ({
  id: `s-${clientId}`,
  parentId: `s-${parentClientId}`,
  label: clientId,
  orderIndex,
  memo: null,
  tagIds: [],
});

/*
r 밑에 a, b, c가 있고, a1은 a의 자식이라 형제 사이에 끼어 있다.
*/
const createNodes = () => [
  createNode("r", 1),
  createNode("a", 1),
  createNode("a1", 1),
  createNode("b", 2),
  createNode("c", 3),
];

const getOrder = (nodes: ReturnType<typeof createNodes>) =>
  nodes.map((node) => `${node.id}:${node.data.orderIndex}`);

describe("getNodesInServerSiblingOrder", () => {
  it("응답이 store와 같으면 입력 배열을 그대로 돌려준다", () => {
    const nodes = createNodes();

    const result = getNodesInServerSiblingOrder(nodes, [
      [
        createServerNode("a", "r", 1),
        createServerNode("b", "r", 2),
        createServerNode("c", "r", 3),
      ],
    ]);

    expect(result).toBe(nodes);
  });

  it("형제들이 차지하던 배열 자리 안에서 서버 순서로 다시 놓고 orderIndex를 맞춘다", () => {
    const nodes = createNodes();

    const result = getNodesInServerSiblingOrder(nodes, [
      [
        createServerNode("a", "r", 3),
        createServerNode("b", "r", 1),
        createServerNode("c", "r", 2),
      ],
    ]);

    expect(getOrder(result)).toEqual(["r:1", "b:1", "a1:1", "c:2", "a:3"]);
    expect(result[2]).toBe(nodes[2]);
  });

  it("여러 형제 목록을 한 번에 맞춘다", () => {
    const nodes = createNodes();

    const result = getNodesInServerSiblingOrder(nodes, [
      [createServerNode("c", "r", 1), createServerNode("b", "r", 2)],
      [createServerNode("a1", "a", 4)],
    ]);

    expect(getOrder(result)).toEqual(["r:1", "a:1", "a1:4", "c:1", "b:2"]);
  });

  it("응답에만 있는 노드는 들이지 않는다", () => {
    const nodes = createNodes();

    const result = getNodesInServerSiblingOrder(nodes, [
      [
        createServerNode("new", "r", 1),
        createServerNode("a", "r", 2),
        createServerNode("b", "r", 3),
        createServerNode("c", "r", 4),
      ],
    ]);

    expect(getOrder(result)).toEqual(["r:1", "a:2", "a1:1", "b:3", "c:4"]);
  });
});
