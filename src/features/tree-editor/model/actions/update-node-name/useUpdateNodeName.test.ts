import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NODE_ERROR_CODE, nodeApi, type TreeNode } from "@/src/entities/tree";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
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
        "saved",
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
        "failed",
      );
    });

    expect(getNodeData()).toMatchObject({ label: "이전 제목", version: 3 });
  });

  describe("다른 곳의 수정과 충돌하면", () => {
    it("최신 제목·메모·version을 store에 반영하고 conflict를 돌려준다", async () => {
      vi.spyOn(nodeApi, "editNodeName").mockRejectedValue(
        createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
      );
      vi.spyOn(nodeApi, "getNode").mockResolvedValue({
        ...SERVER_NODE,
        label: "다른 곳의 제목",
        memo: "다른 곳의 메모",
        version: 9,
      });
      const { result } = renderUpdateNodeName();

      await act(async () => {
        await expect(result.current.updateNodeName("새 제목")).resolves.toBe(
          "conflict",
        );
      });

      expect(getNodeData()).toMatchObject({
        label: "다른 곳의 제목",
        memo: "다른 곳의 메모",
        version: 9,
      });
    });

    it("다시 저장하면 최신 version으로 보낸다", async () => {
      const editNodeNameSpy = vi
        .spyOn(nodeApi, "editNodeName")
        .mockRejectedValueOnce(
          createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
        )
        .mockResolvedValueOnce({ ...SERVER_NODE, version: 10 });
      vi.spyOn(nodeApi, "getNode").mockResolvedValue({
        ...SERVER_NODE,
        label: "다른 곳의 제목",
        version: 9,
      });
      const { result } = renderUpdateNodeName();

      await act(async () => {
        await result.current.updateNodeName("새 제목");
      });
      await act(async () => {
        await expect(result.current.updateNodeName("새 제목")).resolves.toBe(
          "saved",
        );
      });

      expect(editNodeNameSpy).toHaveBeenLastCalledWith(5, 11, {
        name: "새 제목",
        version: 9,
      });
    });

    it("최신 값을 읽지 못해도 제목을 되돌리고 conflict를 돌려준다", async () => {
      vi.spyOn(nodeApi, "editNodeName").mockRejectedValue(
        createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
      );
      vi.spyOn(nodeApi, "getNode").mockRejectedValue(new Error("failed"));
      const { result } = renderUpdateNodeName();

      await act(async () => {
        await expect(result.current.updateNodeName("새 제목")).resolves.toBe(
          "conflict",
        );
      });

      expect(getNodeData()).toMatchObject({ label: "이전 제목", version: 3 });
    });

    it("최신 값을 읽을 때 노드가 지워졌으면 notFound를 돌려준다", async () => {
      vi.spyOn(nodeApi, "editNodeName").mockRejectedValue(
        createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
      );
      vi.spyOn(nodeApi, "getNode").mockRejectedValue(
        createNodeApiError(404, NODE_ERROR_CODE.NODE_NOT_FOUND),
      );
      const { result } = renderUpdateNodeName();

      await act(async () => {
        await expect(result.current.updateNodeName("새 제목")).resolves.toBe(
          "notFound",
        );
      });

      expect(getNodeData().label).toBe("이전 제목");
    });
  });

  it("노드가 다른 곳에서 지워졌으면 제목을 되돌리고 notFound를 돌려준다", async () => {
    vi.spyOn(nodeApi, "editNodeName").mockRejectedValue(
      createNodeApiError(404, NODE_ERROR_CODE.NODE_NOT_FOUND),
    );
    const { result } = renderUpdateNodeName();

    await act(async () => {
      await expect(result.current.updateNodeName("새 제목")).resolves.toBe(
        "notFound",
      );
    });

    expect(getNodeData().label).toBe("이전 제목");
  });
});
