import { describe, it, expect } from "vitest";
import { TreeNode } from "@/src/entities/tree/model/types";
import { transformToFlowElements } from "./mappers";

const createTreeNode = (
  id: string,
  parentId: string | null,
  orderIndex: number,
): TreeNode => ({
  id,
  parentId,
  label: `node ${id}`,
  orderIndex,
  memo: null,
});

describe("transformToFlowElements", () => {
  const treeNodes = [
    createTreeNode("1", null, 0),
    createTreeNode("2", "1", 1),
    createTreeNode("3", "1", 2),
  ];

  /*
  노드 신원이 서버 ID와 같으면, 서버에 아직 없는 노드에 임시 ID를 쓰고 응답이 오면 교체하는
  구조로 되돌아간다. 교체는 배치를 바꾸지 않으면서 레이아웃을 다시 돌리므로 여기서 막는다.
  */
  it("노드 신원을 서버 ID와 분리해 새로 부여한다", () => {
    const { nodes } = transformToFlowElements(treeNodes);

    const clientIds = nodes.map((node) => node.id);

    expect(new Set(clientIds).size).toBe(clientIds.length); // 신원은 노드마다 달라야 한다.
    expect(clientIds).not.toContain("1");
    expect(clientIds).not.toContain("2");
    expect(clientIds).not.toContain("3");
  });

  it("서버가 확정한 ID는 data.serverId로 옮긴다", () => {
    const { nodes } = transformToFlowElements(treeNodes);

    expect(nodes.map((node) => node.data.serverId)).toEqual(["1", "2", "3"]);
  });

  it("엣지는 부모와 자식의 편집기 노드 ID를 잇는다", () => {
    const { nodes, edges } = transformToFlowElements(treeNodes);

    const clientIdByServerId = new Map(
      nodes.map((node) => [node.data.serverId, node.id]),
    );

    expect(edges.map((edge) => [edge.source, edge.target])).toEqual([
      [clientIdByServerId.get("1"), clientIdByServerId.get("2")],
      [clientIdByServerId.get("1"), clientIdByServerId.get("3")],
    ]);
  });

  /*
  ELK의 considerModelOrder가 배열 순서로 형제 배치를 정하므로, 정렬은 화면에 넘기기 직전인
  여기서 보장한다. 캐시는 순서를 약속하지 않는다.
  */
  it("orderIndex 순으로 정렬한다", () => {
    const unorderedNodes = [
      createTreeNode("3", "1", 2),
      createTreeNode("1", null, 0),
      createTreeNode("2", "1", 1),
    ];

    const { nodes } = transformToFlowElements(unorderedNodes);

    expect(nodes.map((node) => node.data.serverId)).toEqual(["1", "2", "3"]);
  });

  it("부모가 목록에 없으면 엣지를 만들지 않는다", () => {
    const { nodes, edges } = transformToFlowElements([
      createTreeNode("2", "99", 1),
    ]);

    expect(nodes).toHaveLength(1);
    expect(edges).toEqual([]);
  });
});
