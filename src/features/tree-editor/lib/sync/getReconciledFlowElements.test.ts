import { describe, expect, it } from "vitest";
import { TreeNode } from "@/src/entities/tree";
import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getReconciledFlowElements } from "./getReconciledFlowElements";

const createServerNode = (
  id: string,
  parentId: string | null,
  orderIndex: number,
  overrides: Partial<TreeNode> = {},
): TreeNode => ({
  id,
  parentId,
  label: `node ${id}`,
  orderIndex,
  memo: null,
  version: 0,
  tagIds: [],
  ...overrides,
});

const createCurrentNode = (
  clientId: string,
  serverId: string,
  orderIndex: number,
): CustomEditorNode => ({
  id: clientId,
  type: "custom",
  data: {
    serverId,
    label: `node ${serverId}`,
    orderIndex,
    memo: null,
    version: 0,
    tagIds: [],
  },
  position: { x: orderIndex * 100, y: orderIndex * 10 },
  measured: { width: 168, height: 60 },
});

const createCurrentEdge = (
  id: string,
  source: string,
  target: string,
): CustomEditorEdge => ({ id, source, target, type: "custom" });

const CURRENT_NODES = [
  createCurrentNode("root", "1", 1),
  createCurrentNode("a", "2", 2),
  createCurrentNode("b", "3", 3),
];
const CURRENT_EDGES = [
  createCurrentEdge("edge-a", "root", "a"),
  createCurrentEdge("edge-b", "root", "b"),
];
const SERVER_NODES = [
  createServerNode("1", null, 1),
  createServerNode("2", "1", 2),
  createServerNode("3", "1", 3),
];

const reconcile = (serverNodes: TreeNode[]) =>
  getReconciledFlowElements({
    serverNodes,
    currentNodes: CURRENT_NODES,
    currentEdges: CURRENT_EDGES,
  });

describe("getReconciledFlowElements", () => {
  it("바뀐 것이 없으면 노드와 엣지 객체를 그대로 쓴다", () => {
    const { nodes, edges } = reconcile(SERVER_NODES);

    expect(nodes).toEqual(CURRENT_NODES);
    nodes.forEach((node, index) => expect(node).toBe(CURRENT_NODES[index]));
    edges.forEach((edge, index) => expect(edge).toBe(CURRENT_EDGES[index]));
  });

  it("서버 데이터만 바꾸고 신원과 화면 값은 물려받는다", () => {
    const selectedNodes = CURRENT_NODES.map((node) =>
      node.id === "a" ? { ...node, selected: true } : node,
    );

    const { nodes } = getReconciledFlowElements({
      serverNodes: [
        createServerNode("1", null, 1),
        createServerNode("2", "1", 2, {
          label: "바뀐 제목",
          memo: "바뀐 메모",
          version: 5,
          tagIds: ["7"],
        }),
        createServerNode("3", "1", 3),
      ],
      currentNodes: selectedNodes,
      currentEdges: CURRENT_EDGES,
    });

    expect(nodes[1]).toEqual({
      ...selectedNodes[1],
      data: {
        serverId: "2",
        label: "바뀐 제목",
        orderIndex: 2,
        memo: "바뀐 메모",
        version: 5,
        tagIds: ["7"],
      },
    });
    expect(nodes[0]).toBe(selectedNodes[0]);
  });

  it("새 노드는 새 신원과 원점 좌표로 만들고 부모와 잇는다", () => {
    const { nodes, edges } = reconcile([
      ...SERVER_NODES,
      createServerNode("4", "2", 1),
    ]);
    const addedNode = nodes.find((node) => node.data.serverId === "4");

    expect(addedNode?.position).toEqual({ x: 0, y: 0 });
    expect(["root", "a", "b"]).not.toContain(addedNode?.id);
    expect(edges.find((edge) => edge.target === addedNode?.id)?.source).toBe(
      "a",
    );
  });

  it("서버에 없는 노드는 엣지와 함께 뺀다", () => {
    const { nodes, edges } = reconcile(SERVER_NODES.slice(0, 2));

    expect(nodes.map((node) => node.id)).toEqual(["root", "a"]);
    expect(edges.map((edge) => edge.target)).toEqual(["a"]);
  });

  it("부모가 바뀐 노드는 새 부모로 잇는다", () => {
    const { nodes, edges } = reconcile([
      createServerNode("1", null, 1),
      createServerNode("2", "1", 2),
      createServerNode("3", "2", 3),
    ]);

    expect(nodes.map((node) => node.id)).toEqual(["root", "a", "b"]);
    expect(edges.find((edge) => edge.target === "b")?.source).toBe("a");
  });

  it("노드 배열을 orderIndex 순서로 놓는다", () => {
    const { nodes } = reconcile([
      createServerNode("1", null, 1),
      createServerNode("3", "1", 2),
      createServerNode("2", "1", 3),
    ]);

    expect(nodes.map((node) => node.id)).toEqual(["root", "b", "a"]);
  });
});
