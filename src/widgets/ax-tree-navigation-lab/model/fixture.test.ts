import { describe, expect, it } from "vitest";
import {
  PROTOTYPE_NODE_HEIGHT,
  PROTOTYPE_SIBLING_GAP,
  getPrototypeFocusNodeIds,
  prototypeBranchIds,
  prototypeFixture,
  PROTOTYPE_TOPOLOGY_PROJECTION,
} from "./fixture";
import { projectTopologyPoint } from "./topology";

describe("AX tree navigation prototype fixture", () => {
  it("형제가 많은 상황과 하위 트리를 함께 제공한다", () => {
    expect(prototypeBranchIds).toHaveLength(12);
    expect(prototypeFixture.nodes.length).toBeGreaterThan(12);
    expect(getPrototypeFocusNodeIds("interaction")).toHaveLength(8);
  });

  it("형제 서브트리의 세로 영역이 서로 겹치지 않는다", () => {
    const branchTops = prototypeBranchIds.map((branchId) => {
      const branchNodes = prototypeFixture.nodes.filter(
        (node) => node.id === branchId || node.data.branchId === branchId,
      );

      return {
        branchId,
        top: Math.min(...branchNodes.map(({ position }) => position.y)),
        bottom: Math.max(
          ...branchNodes.map(
            ({ position }) => position.y + PROTOTYPE_NODE_HEIGHT,
          ),
        ),
      };
    });

    branchTops.slice(1).forEach((branch, index) => {
      expect(branch.top - branchTops[index].bottom).toBeGreaterThanOrEqual(
        PROTOTYPE_SIBLING_GAP,
      );
    });
  });

  it("자식으로 나가는 연결선이 있는 노드는 leaf로 표시하지 않는다", () => {
    const nodeById = new Map(
      prototypeFixture.nodes.map((node) => [node.id, node]),
    );

    prototypeFixture.edges.forEach((edge) => {
      expect(nodeById.get(edge.source)?.data.kind).not.toBe("leaf");
    });
  });

  it("모든 화면 위치를 위상 좌표의 projection으로 만든다", () => {
    prototypeFixture.nodes.forEach((node) => {
      expect(node.position).toEqual(
        projectTopologyPoint(node.data.topology, PROTOTYPE_TOPOLOGY_PROJECTION),
      );
    });
  });
});
