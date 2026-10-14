import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { useTreeStore } from "./treeStore";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { createEditorEdge } from "../lib/add-node/createEditorEdge";

const createNode = (index: number) =>
  createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label: `node ${index}`,
    orderIndex: index,
    x: 0,
    y: 0,
  });

const getSelectedClientIds = () =>
  useTreeStore
    .getState()
    .nodes.filter((node) => node.selected)
    .map((node) => node.id);

describe("selectOnlyNodeInStore", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [1, 2, 3].map(createNode),
      edges: [
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c3" }),
      ],
    });
    useTreeStore.temporal.getState().clear();
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  it("대상 노드만 선택하고 이전에 선택된 노드의 선택을 푼다", () => {
    const { selectOnlyNodeInStore } = useTreeStore.getState();

    selectOnlyNodeInStore("c2");
    selectOnlyNodeInStore("c3");

    expect(getSelectedClientIds()).toEqual(["c3"]);
  });

  it("선택 상태가 그대로인 노드는 같은 객체를 유지한다", () => {
    const { selectOnlyNodeInStore } = useTreeStore.getState();
    const [firstNode, , thirdNode] = useTreeStore.getState().nodes;

    selectOnlyNodeInStore("c2");

    const [nextFirstNode, , nextThirdNode] = useTreeStore.getState().nodes;
    expect(nextFirstNode).toBe(firstNode);
    expect(nextThirdNode).toBe(thirdNode);
  });

  it("undo history에 기록되지 않는다", () => {
    useTreeStore.getState().selectOnlyNodeInStore("c2");

    expect(useTreeStore.temporal.getState().pastStates).toHaveLength(0);
  });
});
