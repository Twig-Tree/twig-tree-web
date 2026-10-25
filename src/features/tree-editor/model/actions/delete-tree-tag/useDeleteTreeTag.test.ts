import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeTagStore } from "../../tag/treeTagStore";
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

const getTreeTagIds = () =>
  useTreeTagStore.getState().tags.map((tag) => tag.id);

describe("useDeleteTreeTag", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createNode(1, ["t1", "t2"]),
        createNode(2, ["t1"]),
        createNode(3, []),
      ],
      edges: [],
    });
    useTreeTagStore.getState().addTag({ id: "t1", name: "React" });
    useTreeTagStore.getState().addTag({ id: "t2", name: "중요" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useTreeTagStore.getState().resetTags();
  });

  it("붙은 노드 수를 알리고, 확인하면 트리 태그와 모든 노드에서 그 태그를 뺀다", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result } = renderHook(() => useDeleteTreeTag());

    act(() => {
      result.current.handleDeleteTreeTag("t1");
    });

    expect(confirmSpy).toHaveBeenCalledExactlyOnceWith(
      '"React" 태그를 삭제하면 관련된 노드 2개에서도 제거됩니다.\n삭제하시겠습니까?',
    );
    expect(getTreeTagIds()).toEqual(["t2"]);
    expect(getTagIdsByClientId()).toEqual({ c1: ["t2"], c2: [], c3: [] });
  });

  it("붙은 노드가 없으면 노드 수 없이 묻는다", () => {
    useTreeTagStore.getState().addTag({ id: "t3", name: "복습" });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result } = renderHook(() => useDeleteTreeTag());

    act(() => {
      result.current.handleDeleteTreeTag("t3");
    });

    expect(confirmSpy).toHaveBeenCalledExactlyOnceWith(
      '"복습" 태그를 삭제하시겠습니까?',
    );
    expect(getTreeTagIds()).toEqual(["t1", "t2"]);
  });

  it("확인을 취소하면 아무것도 바꾸지 않는다", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => useDeleteTreeTag());

    act(() => {
      result.current.handleDeleteTreeTag("t1");
    });

    expect(getTreeTagIds()).toEqual(["t1", "t2"]);
    expect(getTagIdsByClientId()).toEqual({
      c1: ["t1", "t2"],
      c2: ["t1"],
      c3: [],
    });
  });
});
