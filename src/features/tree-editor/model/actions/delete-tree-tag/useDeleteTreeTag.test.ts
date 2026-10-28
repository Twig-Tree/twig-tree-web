import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { tagApi, treeQueryKeys, type TreeTag } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useDeleteTreeTag } from "./useDeleteTreeTag";

const createNode = (index: number, tagIds: string[]) => {
  const node = createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label: `node ${index}`,
    orderIndex: index,
    x: 0,
    y: 0,
  });

  return { ...node, data: { ...node.data, tagIds } };
};

const getTagIdsByClientId = () =>
  Object.fromEntries(
    useTreeStore.getState().nodes.map((node) => [node.id, node.data.tagIds]),
  );

/*
트리 태그 목록(React 1, TypeScript 2) 조회가 끝난 뒤에 돌려준다. 삭제는 목록에 있는 태그만 다룬다.
*/
const renderDeleteTreeTag = async () => {
  const { wrapper, queryClient } = createQueryWrapper();
  const rendered = renderHook(() => useDeleteTreeTag(), { wrapper });

  await waitFor(() =>
    expect(queryClient.getQueryData(treeQueryKeys.tags("5"))).toBeDefined(),
  );

  const getTreeTagIds = () =>
    queryClient
      .getQueryData<TreeTag[]>(treeQueryKeys.tags("5"))
      ?.map((tag) => tag.id);

  return { ...rendered, getTreeTagIds };
};

describe("useDeleteTreeTag", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [createNode(1, ["1"]), createNode(2, ["1"]), createNode(3, [])],
      edges: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
  });

  it("붙은 노드 수를 알리고, 확인하면 서버에서 지운 뒤 트리 태그와 모든 노드에서 그 태그를 뺀다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result, getTreeTagIds } = await renderDeleteTreeTag();

    await act(() => result.current.handleDeleteTreeTag("1"));

    expect(confirmSpy).toHaveBeenCalledExactlyOnceWith(
      '"React" 태그를 삭제하면 관련된 노드 2개에서도 제거됩니다.\n삭제하시겠습니까?',
    );
    expect(getTreeTagIds()).toEqual(["2"]);
    expect(getTagIdsByClientId()).toEqual({ c1: [], c2: [], c3: [] });
  });

  it("붙은 노드가 없으면 노드 수 없이 묻는다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result, getTreeTagIds } = await renderDeleteTreeTag();

    await act(() => result.current.handleDeleteTreeTag("2"));

    expect(confirmSpy).toHaveBeenCalledExactlyOnceWith(
      '"TypeScript" 태그를 삭제하시겠습니까?',
    );
    expect(getTreeTagIds()).toEqual(["1"]);
  });

  it("확인을 취소하면 요청하지 않고 아무것도 바꾸지 않는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const deleteTreeTagSpy = vi.spyOn(tagApi, "deleteTreeTag");
    const { result, getTreeTagIds } = await renderDeleteTreeTag();

    await act(() => result.current.handleDeleteTreeTag("1"));

    expect(deleteTreeTagSpy).not.toHaveBeenCalled();
    expect(getTreeTagIds()).toEqual(["1", "2"]);
    expect(getTagIdsByClientId()).toEqual({ c1: ["1"], c2: ["1"], c3: [] });
  });

  it("같은 태그의 삭제 요청 중에 다시 누르면 묻지도 요청하지도 않는다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const deleteTreeTagSpy = vi.spyOn(tagApi, "deleteTreeTag");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result, getTreeTagIds } = await renderDeleteTreeTag();

    await act(() =>
      Promise.all([
        result.current.handleDeleteTreeTag("1"),
        result.current.handleDeleteTreeTag("1"),
      ]),
    );

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(deleteTreeTagSpy).toHaveBeenCalledOnce();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(getTreeTagIds()).toEqual(["2"]);
  });

  it("삭제 요청이 끝나면 다른 삭제를 다시 받는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(tagApi, "deleteTreeTag").mockRejectedValueOnce(new Error());
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result, getTreeTagIds } = await renderDeleteTreeTag();

    await act(() => result.current.handleDeleteTreeTag("1"));
    await act(() => result.current.handleDeleteTreeTag("1"));

    expect(getTreeTagIds()).toEqual(["2"]);
  });

  it("삭제 요청이 실패하면 알리고 트리 태그와 노드를 그대로 둔다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(tagApi, "deleteTreeTag").mockRejectedValueOnce(new Error());
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result, getTreeTagIds } = await renderDeleteTreeTag();

    await act(() => result.current.handleDeleteTreeTag("1"));

    expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
      "태그 삭제에 실패했습니다.",
    );
    expect(getTreeTagIds()).toEqual(["1", "2"]);
    expect(getTagIdsByClientId()).toEqual({ c1: ["1"], c2: ["1"], c3: [] });
  });
});
