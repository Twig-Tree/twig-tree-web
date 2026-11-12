import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TreeNode } from "@/src/entities/tree";
import { useTreeStore } from "../treeStore";
import { useInitializeTree } from "./useInitializeTree";

const ROOT_NODE: TreeNode = {
  id: "1",
  parentId: null,
  label: "루트",
  orderIndex: 1,
  memo: null,
  version: 0,
  tagIds: [],
};
const CHILD_NODE: TreeNode = {
  ...ROOT_NODE,
  id: "2",
  parentId: "1",
  label: "자식",
};

const getStoreLabels = () =>
  useTreeStore.getState().nodes.map((node) => node.data.label);

/*
함수 이름 : renderInitializeTree
기능 : 트리 ID와 조회 결과를 바꿔 가며 초기화 hook을 그린다.
인자 : TreeNode[] | undefined treeData -> 처음 넘길 조회 결과
반환값 : renderHook 결과
*/
const renderInitializeTree = (treeData: TreeNode[] | undefined) =>
  renderHook(
    (props: { treeData: TreeNode[] | undefined }) =>
      useInitializeTree({ treeId: "5", treeData: props.treeData }),
    { initialProps: { treeData } },
  );

describe("useInitializeTree", () => {
  afterEach(() => {
    useTreeStore.getState().resetTree();
  });

  it("조회 결과로 store를 채운다", () => {
    renderInitializeTree([ROOT_NODE, CHILD_NODE]);

    expect(useTreeStore.getState().treeId).toBe("5");
    expect(getStoreLabels()).toEqual(["루트", "자식"]);
  });

  /*
  재초기화는 위치와 편집 중인 내용을 덮어쓴다. 다른 곳의 변경은 useSyncExternalTreeChange가 맡는다.
  */
  it("노드가 있는 store는 같은 트리의 조회 결과가 바뀌어도 다시 채우지 않는다", () => {
    const view = renderInitializeTree([ROOT_NODE]);

    view.rerender({ treeData: [ROOT_NODE, CHILD_NODE] });

    expect(getStoreLabels()).toEqual(["루트"]);
  });

  /*
  빈 워크스페이스를 프롬프트로 채우면 treeId는 그대로인 채 조회 결과에 노드가 생긴다.
  */
  it("노드 없는 트리로 채워진 store는 같은 트리의 조회 결과에 노드가 생기면 다시 채운다", () => {
    const view = renderInitializeTree([]);

    expect(useTreeStore.getState().treeId).toBe("5");
    expect(getStoreLabels()).toEqual([]);

    view.rerender({ treeData: [ROOT_NODE, CHILD_NODE] });

    expect(getStoreLabels()).toEqual(["루트", "자식"]);
  });

  it("트리가 없는 워크스페이스는 store를 채우지 않는다", () => {
    renderHook(() => useInitializeTree({ treeId: null, treeData: undefined }));

    expect(useTreeStore.getState().treeId).toBeNull();
  });
});
