import { describe, expect, it } from "vitest";
import { createEditorEdge, createEditorNode } from "@/src/features/tree-editor";
import {
  createLabChildElements,
  getNodeActionBlockReason,
  NODE_ACTION_IDS,
} from "./nodeActions";

const createNode = (clientId: string, orderIndex: number) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex,
    x: 10,
    y: 20,
  });

/*
r 밑에 a(1), b(2)가 있고 a 밑에 c(1)가 있다.
*/
const nodes = [
  createNode("r", 1),
  createNode("a", 1),
  createNode("b", 2),
  createNode("c", 1),
];
const edges = [
  createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
  createEditorEdge({ sourceClientId: "r", targetClientId: "b" }),
  createEditorEdge({ sourceClientId: "a", targetClientId: "c" }),
];

describe("getNodeActionBlockReason", () => {
  it("루트 노드의 삭제를 막는다", () => {
    expect(getNodeActionBlockReason("delete", "r", edges)).toBe(
      "루트 노드는 삭제할 수 없습니다.",
    );
  });

  it("루트 노드의 다른 동작은 막지 않는다", () => {
    const otherActions = NODE_ACTION_IDS.filter((id) => id !== "delete");

    otherActions.forEach((actionId) => {
      expect(getNodeActionBlockReason(actionId, "r", edges)).toBeNull();
    });
  });

  it("루트가 아닌 노드는 모든 동작을 실행할 수 있다", () => {
    NODE_ACTION_IDS.forEach((actionId) => {
      expect(getNodeActionBlockReason(actionId, "a", edges)).toBeNull();
    });
  });
});

describe("createLabChildElements", () => {
  it("기존 자식 다음 순번으로 이름과 orderIndex를 정한다", () => {
    const { node } = createLabChildElements(nodes[0], nodes, edges);

    expect(node.data).toMatchObject({ label: "새 노드 3", orderIndex: 3 });
  });

  it("자식이 없는 노드에는 첫 순번으로 붙인다", () => {
    const { node } = createLabChildElements(nodes[2], nodes, edges);

    expect(node.data).toMatchObject({ label: "새 노드 1", orderIndex: 1 });
  });

  /*
  접힘 상태가 serverId로 노드를 가리키므로, 비어 있으면 새 노드 아래에 붙인 자식을 펼칠 수 없다.
  */
  it("새 노드를 저장된 노드처럼 serverId를 채워 만든다", () => {
    const { node } = createLabChildElements(nodes[1], nodes, edges);

    expect(node.data.serverId).toBe(`lab-${node.id}`);
  });

  it("부모에서 새 노드로 가는 엣지를 만든다", () => {
    const { node, edge } = createLabChildElements(nodes[1], nodes, edges);

    expect(edge).toMatchObject({ source: "a", target: node.id });
  });
});
