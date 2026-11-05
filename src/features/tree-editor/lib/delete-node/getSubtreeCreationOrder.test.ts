import { describe, it, expect } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import { getSubtreeCreationOrder } from "./getSubtreeCreationOrder";

const createNode = (clientId: string) =>
  createEditorNode({
    clientId,
    serverId: null,
    label: clientId,
    orderIndex: 1,
    x: 0,
    y: 0,
  });

const createEdge = (sourceClientId: string, targetClientId: string) =>
  createEditorEdge({ sourceClientId, targetClientId });

describe("getSubtreeCreationOrder", () => {
  /*
  p(지우지 않은 부모)
  └─ a
     ├─ b
     │  └─ d
     └─ c
  엣지 배열에서 자식이 부모보다 앞에 있어도 부모부터 만든다.
  */
  it("부모를 자식보다 먼저 두고, 루트의 부모는 원래 부모로 둔다", () => {
    const nodes = ["d", "c", "b", "a"].map(createNode);
    const edges = [
      createEdge("b", "d"),
      createEdge("a", "c"),
      createEdge("a", "b"),
      createEdge("p", "a"),
    ];

    const steps = getSubtreeCreationOrder(nodes, edges, "a").map(
      ({ node, parentClientId }) => `${parentClientId}>${node.id}`,
    );

    expect(steps).toEqual(["p>a", "a>c", "a>b", "b>d"]);
  });
});
