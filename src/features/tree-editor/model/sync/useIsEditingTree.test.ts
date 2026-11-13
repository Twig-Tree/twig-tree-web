import { act, renderHook, waitFor } from "@testing-library/react";
import { useMutation } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { treeQueryKeys } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useTreeStore } from "../treeStore";
import { useEditingStore } from "./editingStore";
import { useIsEditingTree } from "./useIsEditingTree";

const renderIsEditingTree = (isStructureEditing = false) => {
  const { wrapper } = createQueryWrapper();

  return renderHook(() => useIsEditingTree({ isStructureEditing }), {
    wrapper,
  });
};

describe("useIsEditingTree", () => {
  afterEach(() => {
    useEditingStore.setState({
      nameEditors: new Map(),
      isMemoDirty: false,
    });
    useTreeStore.getState().resetTree();
  });

  it("아무것도 하지 않으면 편집 중이 아니다", () => {
    expect(renderIsEditingTree().result.current).toBe(false);
  });

  it("이름 입력창이 모두 닫혀야 편집이 끝난다", () => {
    const { result } = renderIsEditingTree();

    act(() => {
      useEditingStore.getState().startNodeNameEditing("c1", "canvas");
      useEditingStore.getState().startNodeNameEditing("c2", "panel");
    });
    expect(result.current).toBe(true);

    act(() => useEditingStore.getState().endNodeNameEditing("c1", "canvas"));
    expect(result.current).toBe(true);

    act(() => useEditingStore.getState().endNodeNameEditing("c2", "panel"));
    expect(result.current).toBe(false);
  });

  it("메모에 저장하지 않은 입력이 있으면 편집 중이다", () => {
    const { result } = renderIsEditingTree();

    act(() => useEditingStore.getState().setMemoDirty(true));

    expect(result.current).toBe(true);
  });

  it("노드를 끄는 중이면 편집 중이다", () => {
    const { result } = renderIsEditingTree();
    const node = createEditorNode({
      clientId: "c1",
      serverId: "1",
      label: "node",
      orderIndex: 1,
      x: 0,
      y: 0,
    });

    act(() =>
      useTreeStore.getState().initializeTree({
        treeId: "5",
        nodes: [{ ...node, dragging: true }],
        edges: [],
      }),
    );

    expect(result.current).toBe(true);
  });

  it("페이지의 구조 편집 잠금이 걸려 있으면 편집 중이다", () => {
    expect(renderIsEditingTree(true).result.current).toBe(true);
  });

  it("트리 mutation이 진행 중이면 편집 중이다", async () => {
    let finishMutation!: () => void;
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => ({
        isEditing: useIsEditingTree({ isStructureEditing: false }),
        mutation: useMutation({
          mutationKey: treeQueryKeys.mutations(),
          mutationFn: () =>
            new Promise<void>((resolve) => {
              finishMutation = resolve;
            }),
        }),
      }),
      { wrapper },
    );

    act(() => result.current.mutation.mutate());
    await waitFor(() => expect(result.current.isEditing).toBe(true));

    act(() => finishMutation());
    await waitFor(() => expect(result.current.isEditing).toBe(false));
  });
});
