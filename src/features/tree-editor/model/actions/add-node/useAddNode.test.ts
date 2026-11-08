import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { treeApi } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useEditHistoryStore } from "../../history/editHistoryStore";
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
    useEditHistoryStore.getState().clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useEditHistoryStore.getState().clear();
  });

  it("서버가 확정한 ID를 채우고 undo 기록을 남긴다", async () => {
    vi.spyOn(treeApi, "createNode").mockResolvedValue({
      id: "77",
      parentId: "1",
      label: "새 노드 2",
      orderIndex: 2,
      memo: null,
      tagIds: [],
    });
    const { result } = renderAddNode();

    act(() => {
      result.current.handleAddNode();
    });

    const addedNode = useTreeStore.getState().nodes[2];
    await waitFor(() =>
      expect(useEditHistoryStore.getState().past).toEqual([
        {
          type: "add",
          clientId: addedNode.id,
          parentClientId: "c1",
          label: "새 노드 2",
          memo: null,
          tagIds: [],
        },
      ]),
    );
    expect(useTreeStore.getState().nodes[2].data.serverId).toBe("77");
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
    expect(useEditHistoryStore.getState().past).toHaveLength(0);
    expect(useEditHistoryStore.getState().future).toHaveLength(0);
  });
});
