import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { treeApi } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useAddNode } from "./useAddNode";

/*
1번 루트 밑에 2(1)가 있다. 편집기 노드 ID는 "c" + 서버 ID로 둔다.
*/
const createNode = (serverId: string, orderIndex: number) =>
  createEditorNode({
    clientId: `c${serverId}`,
    serverId,
    label: `node ${serverId}`,
    orderIndex,
    x: 0,
    y: 0,
  });

const renderAddNode = () => {
  const { wrapper } = createQueryWrapper();
  const { nodes, edges } = useTreeStore.getState();

  return renderHook(
    () =>
      useAddNode({
        treeId: "10",
        selectedNode: nodes[0],
        nodes,
        edges,
      }),
    { wrapper },
  );
};

describe("useAddNode", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "10",
      nodes: [createNode("1", 1), createNode("2", 1)],
      edges: [createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" })],
    });
    useTreeStore.temporal.getState().clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  it("서버가 거절하면 추가한 노드와 엣지만 빼고, history에도 남기지 않는다", async () => {
    vi.spyOn(treeApi, "createNode").mockRejectedValue(new Error("failed"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { nodes: initialNodes, edges: initialEdges } =
      useTreeStore.getState();
    const { result } = renderAddNode();

    act(() => {
      result.current.handleAddNode();
    });

    expect(useTreeStore.getState().nodes).toHaveLength(3);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
        "노드 추가에 실패했습니다.",
      ),
    );
    expect(useTreeStore.getState().nodes).toEqual(initialNodes);
    expect(useTreeStore.getState().edges).toEqual(initialEdges);
    expect(useTreeStore.temporal.getState().pastStates).toHaveLength(0);
    expect(useTreeStore.temporal.getState().futureStates).toHaveLength(0);
  });
});
