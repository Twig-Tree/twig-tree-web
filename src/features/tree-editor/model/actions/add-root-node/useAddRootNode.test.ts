import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { treeApi } from "@/src/entities/tree";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useAddRootNode } from "./useAddRootNode";

const renderAddRootNode = (treeId: string | null) =>
  renderHook(
    () =>
      useAddRootNode({ treeId, nodes: useTreeStore((state) => state.nodes) }),
    { wrapper: createQueryWrapper().wrapper },
  );

describe("useAddRootNode", () => {
  beforeEach(() => {
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("서버가 확정한 루트 노드를 엣지 없이 store에 넣는다", async () => {
    const { result } = renderAddRootNode("20");

    result.current.handleAddRootNode();

    await waitFor(() => expect(useTreeStore.getState().nodes).toHaveLength(1));

    const { nodes, edges } = useTreeStore.getState();
    expect(nodes[0].data).toEqual({
      serverId: "500",
      label: "Root Node",
      orderIndex: 1,
      memo: null,
    });
    expect(edges).toEqual([]);
  });

  /*
  루트는 지울 수 없으므로 추가를 되돌릴 수 있으면 서버에 루트가 남은 채 store만 비게 된다.
  */
  it("루트를 추가한 뒤에는 되돌릴 기록이 남지 않는다", async () => {
    const { result } = renderAddRootNode("20");

    result.current.handleAddRootNode();

    await waitFor(() => expect(useTreeStore.getState().nodes).toHaveLength(1));

    expect(useTreeStore.temporal.getState().pastStates).toEqual([]);
  });

  it("노드가 이미 있으면 요청하지 않는다", () => {
    const createNodeSpy = vi.spyOn(treeApi, "createNode");
    useTreeStore.setState({
      nodes: [
        createEditorNode({
          clientId: "client-1",
          serverId: "1",
          label: "Root Node",
          orderIndex: 1,
          x: 0,
          y: 0,
        }),
      ],
    });
    const { result } = renderAddRootNode("20");

    result.current.handleAddRootNode();

    expect(createNodeSpy).not.toHaveBeenCalled();
  });

  it("트리가 없으면 요청하지 않는다", () => {
    const createNodeSpy = vi.spyOn(treeApi, "createNode");
    const { result } = renderAddRootNode(null);

    result.current.handleAddRootNode();

    expect(createNodeSpy).not.toHaveBeenCalled();
  });

  it("다른 곳에서 루트가 먼저 생겼으면 새로고침을 안내하고 store는 그대로 둔다", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderAddRootNode("10");

    result.current.handleAddRootNode();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "이미 루트 노드가 있습니다. 새로고침 후 다시 시도해주세요.",
      ),
    );
    expect(useTreeStore.getState().nodes).toEqual([]);
  });
});
