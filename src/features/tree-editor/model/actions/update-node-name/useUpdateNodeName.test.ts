import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nodeApi, type TreeNode } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useUpdateNodeName } from "./useUpdateNodeName";

const SERVER_NODE: TreeNode = {
  id: "11",
  parentId: null,
  label: "서버 제목",
  orderIndex: 1,
  memo: null,
  version: 4,
  tagIds: [],
};

const getNodeData = () => useTreeStore.getState().nodes[0].data;

const renderUpdateNodeName = () => {
  const { wrapper } = createQueryWrapper();

  return renderHook(
    () => useUpdateNodeName({ treeId: "5", clientId: "c1", serverId: "11" }),
    { wrapper },
  );
};

describe("useUpdateNodeName", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createEditorNode({
          clientId: "c1",
          serverId: "11",
          label: "이전 제목",
          orderIndex: 1,
          version: 3,
          x: 0,
          y: 0,
        }),
      ],
      edges: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
  });

  it("store의 version을 보내고 응답의 제목과 version을 store에 반영한다", async () => {
    const editNodeNameSpy = vi
      .spyOn(nodeApi, "editNodeName")
      .mockResolvedValue(SERVER_NODE);
    const { result } = renderUpdateNodeName();

    await act(async () => {
      await expect(result.current.updateNodeName("새 제목")).resolves.toBe(
        true,
      );
    });

    expect(editNodeNameSpy).toHaveBeenCalledExactlyOnceWith(5, 11, {
      name: "새 제목",
      version: 3,
    });
    expect(getNodeData()).toMatchObject({ label: "서버 제목", version: 4 });
  });

  it("실패하면 제목을 되돌리고 version은 그대로 둔다", async () => {
    vi.spyOn(nodeApi, "editNodeName").mockRejectedValue(new Error("failed"));
    const { result } = renderUpdateNodeName();

    await act(async () => {
      await expect(result.current.updateNodeName("새 제목")).resolves.toBe(
        false,
      );
    });

    expect(getNodeData()).toMatchObject({ label: "이전 제목", version: 3 });
  });
});
