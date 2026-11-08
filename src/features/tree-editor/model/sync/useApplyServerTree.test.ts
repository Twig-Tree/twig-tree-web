import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type TreeNode } from "@/src/entities/tree";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useCollapseStore } from "../collapse/collapseStore";
import { useEditHistoryStore } from "../history/editHistoryStore";
import { useHighlightStore } from "../highlight/highlightStore";
import { useTreeStore } from "../treeStore";
import { useApplyServerTree } from "./useApplyServerTree";

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

const createStoreNode = (clientId: string, serverId: string, order: number) =>
  createEditorNode({
    clientId,
    serverId,
    label: `node ${serverId}`,
    orderIndex: order,
    x: order * 100,
    y: 0,
  });

const renderApplyServerTree = () => {
  const onSelectedNodeRemoved = vi.fn();
  const { result } = renderHook(() =>
    useApplyServerTree({ onSelectedNodeRemoved }),
  );

  return { applyServerTree: result.current, onSelectedNodeRemoved };
};

const getNodeByClientId = (clientId: string) =>
  useTreeStore.getState().nodes.find((node) => node.id === clientId);

describe("useApplyServerTree", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createStoreNode("root", "1", 1),
        { ...createStoreNode("a", "2", 2), selected: true },
      ],
      edges: [
        createEditorEdge({ sourceClientId: "root", targetClientId: "a" }),
      ],
    });
    useEditHistoryStore.getState().record({
      type: "add",
      clientId: "a",
      parentClientId: "root",
      label: "node 2",
      memo: null,
      tagIds: [],
    });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useEditHistoryStore.getState().clear();
    useHighlightStore.getState().clearHighlight();
    useCollapseStore.getState().resetCollapse();
  });

  it("서버 값을 반영하면서 신원과 선택을 유지하고 undo 기록을 비운다", () => {
    const { applyServerTree, onSelectedNodeRemoved } = renderApplyServerTree();

    act(() =>
      applyServerTree([
        createServerNode("1", null, 1),
        createServerNode("2", "1", 2, { label: "바뀐 제목", version: 3 }),
      ]),
    );

    expect(getNodeByClientId("a")).toMatchObject({
      selected: true,
      position: { x: 200, y: 0 },
      data: { label: "바뀐 제목", version: 3 },
    });
    expect(useEditHistoryStore.getState().past).toEqual([]);
    expect(onSelectedNodeRemoved).not.toHaveBeenCalled();
  });

  it("선택했던 노드가 사라지면 알린다", () => {
    const { applyServerTree, onSelectedNodeRemoved } = renderApplyServerTree();

    act(() => applyServerTree([createServerNode("1", null, 1)]));

    expect(getNodeByClientId("a")).toBeUndefined();
    expect(onSelectedNodeRemoved).toHaveBeenCalledOnce();
  });

  it("선택하지 않은 노드가 사라지면 알리지 않는다", () => {
    useTreeStore.getState().selectOnlyNodeInStore("root");
    const { applyServerTree, onSelectedNodeRemoved } = renderApplyServerTree();

    act(() => applyServerTree([createServerNode("1", null, 1)]));

    expect(onSelectedNodeRemoved).not.toHaveBeenCalled();
  });

  /*
  접힘 집합이 새 객체가 되면 useNodeTransition이 접힘이 바뀐 것으로 보고 전환을 시작한다.
  */
  it("트리 ID와 접힘 집합, 강조는 건드리지 않는다", () => {
    useCollapseStore.getState().applyExternalCollapse(["2"]);
    useHighlightStore.getState().setHighlight(["a"]);
    const collapsedServerIds = useCollapseStore.getState().collapsedServerIds;
    const { applyServerTree } = renderApplyServerTree();

    act(() =>
      applyServerTree([
        createServerNode("1", null, 1),
        createServerNode("2", "1", 2),
      ]),
    );

    expect(useTreeStore.getState().treeId).toBe("5");
    expect(useCollapseStore.getState().collapsedServerIds).toBe(
      collapsedServerIds,
    );
    expect(useHighlightStore.getState().highlightedClientIds).toEqual(
      new Set(["a"]),
    );
  });
});
