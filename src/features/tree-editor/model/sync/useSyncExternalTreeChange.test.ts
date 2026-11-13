import { act, renderHook, waitFor } from "@testing-library/react";
import { focusManager, useMutation } from "@tanstack/react-query";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import {
  treeApi,
  treeQueryKeys,
  useGetTreeQuery,
  type TreeNode,
} from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useEditHistoryStore } from "../history/editHistoryStore";
import { useTreeStore } from "../treeStore";
import { useEditingStore } from "./editingStore";
import { useExternalChangeCheckStore } from "./externalChangeCheckStore";
import { useSyncExternalTreeChange } from "./useSyncExternalTreeChange";

const SERVER_NODE: TreeNode = {
  id: "1",
  parentId: null,
  label: "원래 제목",
  orderIndex: 1,
  memo: null,
  version: 0,
  tagIds: [],
};
const CHANGED_NODE: TreeNode = {
  ...SERVER_NODE,
  label: "다른 곳의 제목",
  version: 1,
};

const getStoreLabel = () => useTreeStore.getState().nodes[0].data.label;

const returnToTab = () => {
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
};

const flushRequests = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve));
  });

/*
함수 이름 : renderSync
기능 : 트리 조회 캐시를 채운 상태로 동기화 hook을 그린다. 이 탭의 mutation을 흉내 낼 수 있도록 같은 키의 mutation을 함께 만든다.
인자 : boolean isStructureEditing -> 페이지의 구조 편집 잠금 초기값
반환값 : renderHook 결과와 잠금 값을 바꿔 다시 그리는 함수
*/
const renderSync = async (isStructureEditing = false) => {
  const { wrapper } = createQueryWrapper();
  const onSelectedNodeRemoved = vi.fn();
  let finishMutation: () => void = () => {};

  const view = renderHook(
    (props: { isStructureEditing: boolean }) => {
      const query = useGetTreeQuery("5");

      useSyncExternalTreeChange({
        treeId: "5",
        isStructureEditing: props.isStructureEditing,
        onSelectedNodeRemoved,
      });

      return {
        query,
        mutation: useMutation({
          mutationKey: treeQueryKeys.mutations(),
          mutationFn: () =>
            new Promise<void>((resolve) => {
              finishMutation = resolve;
            }),
        }),
      };
    },
    { wrapper, initialProps: { isStructureEditing } },
  );

  await waitFor(() => expect(view.result.current.query.isSuccess).toBe(true));

  return { ...view, finishMutation: () => finishMutation() };
};

describe("useSyncExternalTreeChange", () => {
  let getTreeSpy: MockInstance<typeof treeApi.getTree>;

  beforeEach(() => {
    getTreeSpy = vi.spyOn(treeApi, "getTree").mockResolvedValue([SERVER_NODE]);
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createEditorNode({
          clientId: "c1",
          serverId: "1",
          label: SERVER_NODE.label,
          orderIndex: 1,
          x: 0,
          y: 0,
        }),
      ],
      edges: [],
    });
    useEditHistoryStore.getState().record({
      type: "add",
      clientId: "c1",
      parentClientId: "c0",
      label: "제목",
      memo: null,
      tagIds: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    focusManager.setFocused(undefined);
    useTreeStore.getState().resetTree();
    useEditHistoryStore.getState().clear();
    useEditingStore.setState({
      nameEditors: new Map(),
      isMemoDirty: false,
    });
  });

  it("탭으로 돌아왔을 때 달라진 것이 없으면 undo 기록을 유지한다", async () => {
    await renderSync();

    returnToTab();
    await flushRequests();

    expect(getTreeSpy).toHaveBeenCalledTimes(2);
    expect(useEditHistoryStore.getState().past).toHaveLength(1);
  });

  it("탭으로 돌아왔을 때 달라졌으면 편집기에 반영한다", async () => {
    await renderSync();
    getTreeSpy.mockResolvedValue([CHANGED_NODE]);

    returnToTab();

    await waitFor(() => expect(getStoreLabel()).toBe("다른 곳의 제목"));
    expect(useEditHistoryStore.getState().past).toEqual([]);
  });

  it("편집 중이면 미뤘다가 편집이 끝나면 반영한다", async () => {
    await renderSync();
    act(() => useEditingStore.getState().setMemoDirty(true));
    getTreeSpy.mockResolvedValue([CHANGED_NODE]);

    returnToTab();
    await flushRequests();
    expect(getStoreLabel()).toBe("원래 제목");

    act(() => useEditingStore.getState().setMemoDirty(false));

    await waitFor(() => expect(getStoreLabel()).toBe("다른 곳의 제목"));
  });

  it("재조회 중에 이 탭의 mutation이 시작되면 비교를 버리고 끝난 뒤 다시 확인한다", async () => {
    const { result, finishMutation } = await renderSync();
    let finishFetch: (nodes: TreeNode[]) => void = () => {};

    getTreeSpy.mockReturnValueOnce(
      new Promise<TreeNode[]>((resolve) => {
        finishFetch = resolve;
      }),
    );

    returnToTab();
    await flushRequests();
    act(() => result.current.mutation.mutate());
    await flushRequests();

    act(() => finishFetch([CHANGED_NODE]));
    await flushRequests();
    expect(getStoreLabel()).toBe("원래 제목");

    getTreeSpy.mockResolvedValue([CHANGED_NODE]);
    act(() => finishMutation());

    /*
    mutation이 끝난 뒤 다시 확인하기까지 React Query의 알림, 다시 그리기, effect, 재조회가 이어진다.
    한 번의 setTimeout으로는 실행 환경이 느릴 때 재조회 전에 확인하게 되므로 호출될 때까지 기다린다.
    */
    await waitFor(() => expect(getTreeSpy).toHaveBeenCalledTimes(3));
  });

  it("mutation 중에 돌아오면 요청을 보내지 않고, 끝난 뒤 확인한다", async () => {
    const { result, finishMutation } = await renderSync();

    act(() => result.current.mutation.mutate());
    await flushRequests();
    returnToTab();
    await flushRequests();
    expect(getTreeSpy).toHaveBeenCalledTimes(1);

    getTreeSpy.mockResolvedValue([CHANGED_NODE]);
    act(() => finishMutation());

    await waitFor(() => expect(getStoreLabel()).toBe("다른 곳의 제목"));
  });

  it("구조 편집 잠금이 풀린 뒤에 확인한다", async () => {
    const { rerender } = await renderSync(true);

    returnToTab();
    await flushRequests();
    expect(getTreeSpy).toHaveBeenCalledTimes(1);

    getTreeSpy.mockResolvedValue([CHANGED_NODE]);
    rerender({ isStructureEditing: false });

    await waitFor(() => expect(getStoreLabel()).toBe("다른 곳의 제목"));
  });

  it("조회가 실패하면 편집기를 그대로 둔다", async () => {
    await renderSync();
    getTreeSpy.mockRejectedValue(new Error("failed"));

    returnToTab();
    await flushRequests();

    expect(getStoreLabel()).toBe("원래 제목");
    expect(useEditHistoryStore.getState().past).toHaveLength(1);
  });

  /*
  저장 거절은 포커스 이벤트가 없는 나란히 띄운 창에서도 들어오는 신호다.
  */
  it("저장이 거절되어 확인을 요청하면 다시 조회해 반영한다", async () => {
    await renderSync();
    getTreeSpy.mockResolvedValue([CHANGED_NODE]);

    act(() =>
      useExternalChangeCheckStore.getState().requestExternalChangeCheck(),
    );

    await waitFor(() => expect(getStoreLabel()).toBe("다른 곳의 제목"));
  });
});
