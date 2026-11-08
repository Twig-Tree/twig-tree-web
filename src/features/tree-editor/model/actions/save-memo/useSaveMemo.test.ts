import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  memoApi,
  NODE_ERROR_CODE,
  nodeApi,
  treeQueryKeys,
  type TreeNode,
} from "@/src/entities/tree";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useUpdateNodeName } from "../update-node-name/useUpdateNodeName";
import { useTreeStore } from "../../treeStore";
import { useSaveMemo } from "./useSaveMemo";

const CACHED_NODE: TreeNode = {
  id: "11",
  parentId: null,
  label: "제목",
  orderIndex: 1,
  memo: "저장된 메모",
  version: 3,
  tagIds: [],
};

const getNodeData = () => useTreeStore.getState().nodes[0].data;

const renderSaveMemo = (savedMemo: string | null = "저장된 메모") => {
  const { wrapper, queryClient } = createQueryWrapper();

  queryClient.setQueryData(treeQueryKeys.detail("5"), [CACHED_NODE]);

  const { result } = renderHook(
    () => ({
      saveMemo: useSaveMemo({
        treeId: "5",
        clientId: "c1",
        serverId: "11",
        savedMemo,
      }),
      updateName: useUpdateNodeName({
        treeId: "5",
        clientId: "c1",
        serverId: "11",
      }),
    }),
    { wrapper },
  );

  return { result, queryClient };
};

describe("useSaveMemo", () => {
  beforeEach(() => {
    const node = createEditorNode({
      clientId: "c1",
      serverId: "11",
      label: "제목",
      orderIndex: 1,
      version: 3,
      x: 0,
      y: 0,
    });

    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [{ ...node, data: { ...node.data, memo: "저장된 메모" } }],
      edges: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
  });

  it("메모를 저장하면 store의 version을 보내고 응답의 version을 store와 캐시에 반영한다", async () => {
    const updateMemoSpy = vi.spyOn(memoApi, "updateMemo").mockResolvedValue({
      title: "제목",
      content: "새 메모",
      version: 4,
    });
    const { result, queryClient } = renderSaveMemo();

    await act(async () => {
      await result.current.saveMemo.handleSaveMemo("새 메모");
    });

    expect(updateMemoSpy).toHaveBeenCalledExactlyOnceWith(11, {
      content: "새 메모",
      version: 3,
    });
    expect(getNodeData()).toMatchObject({ memo: "새 메모", version: 4 });
    expect(queryClient.getQueryData(treeQueryKeys.detail("5"))).toEqual([
      { ...CACHED_NODE, memo: "새 메모", version: 4 },
    ]);
  });

  /*
  삭제 응답에는 version이 없다. 올리지 않으면 삭제 뒤의 다음 저장이 자기 삭제와 충돌한다.
  */
  it("메모를 지우면 version을 보내고 store와 캐시의 version을 1 올린다", async () => {
    const deleteMemoSpy = vi
      .spyOn(memoApi, "deleteMemo")
      .mockResolvedValue(undefined);
    const { result, queryClient } = renderSaveMemo();

    await act(async () => {
      await result.current.saveMemo.handleSaveMemo("   ");
    });

    expect(deleteMemoSpy).toHaveBeenCalledExactlyOnceWith(11, 3);
    expect(getNodeData()).toMatchObject({ memo: null, version: 4 });
    expect(queryClient.getQueryData(treeQueryKeys.detail("5"))).toEqual([
      { ...CACHED_NODE, memo: null, version: 4 },
    ]);
  });

  /*
  이름 입력 중 메모 저장을 누르면 blur 저장과 클릭 저장이 연달아 나간다.
  */
  it("같은 노드의 이름 저장이 진행 중이면 끝난 뒤 올라간 version으로 메모를 저장한다", async () => {
    let finishNameSave!: (node: TreeNode) => void;

    vi.spyOn(nodeApi, "editNodeName").mockReturnValue(
      new Promise<TreeNode>((resolve) => {
        finishNameSave = resolve;
      }),
    );

    const updateMemoSpy = vi.spyOn(memoApi, "updateMemo").mockResolvedValue({
      title: "새 제목",
      content: "새 메모",
      version: 5,
    });
    const { result } = renderSaveMemo();

    await act(async () => {
      const nameSave = result.current.updateName.updateNodeName("새 제목");
      const memoSave = result.current.saveMemo.handleSaveMemo("새 메모");

      await new Promise((resolve) => setTimeout(resolve));
      expect(updateMemoSpy).not.toHaveBeenCalled();

      finishNameSave({ ...CACHED_NODE, label: "새 제목", version: 4 });
      await Promise.all([nameSave, memoSave]);
    });

    expect(updateMemoSpy).toHaveBeenCalledExactlyOnceWith(11, {
      content: "새 메모",
      version: 4,
    });
    expect(getNodeData().version).toBe(5);
  });

  it("실패하면 메모와 version을 그대로 두고 알린다", async () => {
    vi.spyOn(memoApi, "updateMemo").mockRejectedValue(new Error("failed"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderSaveMemo();

    await act(async () => {
      await result.current.saveMemo.handleSaveMemo("새 메모");
    });

    expect(getNodeData()).toMatchObject({ memo: "저장된 메모", version: 3 });
    expect(alertSpy).toHaveBeenCalledOnce();
  });

  describe("다른 곳의 수정과 충돌하면", () => {
    const LATEST_NODE: TreeNode = {
      ...CACHED_NODE,
      label: "다른 곳의 제목",
      memo: "다른 곳의 메모",
      version: 9,
    };

    it("최신 값을 store에 반영하고 알림 없이 충돌을 표시한다", async () => {
      vi.spyOn(memoApi, "updateMemo").mockRejectedValue(
        createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
      );
      vi.spyOn(nodeApi, "getNode").mockResolvedValue(LATEST_NODE);
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { result } = renderSaveMemo();

      await act(async () => {
        await result.current.saveMemo.handleSaveMemo("새 메모");
      });

      expect(getNodeData()).toMatchObject({
        label: "다른 곳의 제목",
        memo: "다른 곳의 메모",
        version: 9,
      });
      expect(result.current.saveMemo.hasMemoConflict).toBe(true);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it("다시 저장하면 최신 version으로 보내고 충돌 표시를 지운다", async () => {
      const updateMemoSpy = vi
        .spyOn(memoApi, "updateMemo")
        .mockRejectedValueOnce(
          createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
        )
        .mockResolvedValueOnce({
          title: "다른 곳의 제목",
          content: "새 메모",
          version: 10,
        });
      vi.spyOn(nodeApi, "getNode").mockResolvedValue(LATEST_NODE);
      const { result } = renderSaveMemo();

      await act(async () => {
        await result.current.saveMemo.handleSaveMemo("새 메모");
      });
      await act(async () => {
        await result.current.saveMemo.handleSaveMemo("새 메모");
      });

      expect(updateMemoSpy).toHaveBeenLastCalledWith(11, {
        content: "새 메모",
        version: 9,
      });
      expect(result.current.saveMemo.hasMemoConflict).toBe(false);
      expect(getNodeData()).toMatchObject({ memo: "새 메모", version: 10 });
    });

    /*
    최신 값을 읽는 동안에는 mutation이 pending이 아니다. 이때의 클릭이 통과하면 최신 version으로 나가 안내 없이 덮어쓴다.
    */
    it("최신 값을 읽는 동안 들어온 저장은 보내지 않는다", async () => {
      const updateMemoSpy = vi
        .spyOn(memoApi, "updateMemo")
        .mockRejectedValue(
          createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
        );
      let finishFetch!: (node: TreeNode) => void;

      vi.spyOn(nodeApi, "getNode").mockReturnValue(
        new Promise<TreeNode>((resolve) => {
          finishFetch = resolve;
        }),
      );
      const { result } = renderSaveMemo();

      await act(async () => {
        const firstSave = result.current.saveMemo.handleSaveMemo("새 메모");

        await new Promise((resolve) => setTimeout(resolve));
        await result.current.saveMemo.handleSaveMemo("새 메모");

        finishFetch(LATEST_NODE);
        await firstSave;
      });

      expect(updateMemoSpy).toHaveBeenCalledOnce();
    });
  });

  it("노드가 다른 곳에서 지워졌으면 삭제되었다고 알린다", async () => {
    vi.spyOn(memoApi, "updateMemo").mockRejectedValue(
      createNodeApiError(404, NODE_ERROR_CODE.NODE_NOT_FOUND),
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderSaveMemo();

    await act(async () => {
      await result.current.saveMemo.handleSaveMemo("새 메모");
    });

    expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
      "다른 곳에서 삭제된 노드입니다.",
    );
  });
});
