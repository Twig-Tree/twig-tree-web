import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  memoApi,
  tagApi,
  treeApi,
  treeQueryKeys,
  type TreeTag,
} from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import {
  type AddNodeEntry,
  type DeleteNodeEntry,
  type MoveNodeEntry,
  useEditHistoryStore,
} from "../../history/editHistoryStore";
import { useTreeStore } from "../../treeStore";
import { useUndoRedo } from "./useUndoRedo";

/*
1번 루트 밑에 2(1), 3(2)이 있고, 21은 2에서 3 밑으로 옮겨진 뒤다. 편집기 노드 ID는 "c" + 서버 ID로 둔다.

c1
├─ c2
└─ c3
   └─ c21
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

const addEntry: AddNodeEntry = {
  type: "add",
  clientId: "c3",
  parentClientId: "c1",
  label: "node 3",
  memo: null,
  tagIds: [],
};

const moveEntry: MoveNodeEntry = {
  type: "move",
  clientId: "c21",
  from: { parentClientId: "c2", position: 1 },
  to: { parentClientId: "c3", position: 1 },
};

const getNodeById = (clientId: string) =>
  useTreeStore.getState().nodes.find((node) => node.id === clientId);

const getParentClientId = (clientId: string) =>
  useTreeStore.getState().edges.find((edge) => edge.target === clientId)
    ?.source;

const getHistory = () => {
  const { past, future } = useEditHistoryStore.getState();

  return { past, future };
};

// 서버가 에러 코드를 담아 응답한 실패를 만든다.
const createApiError = (status: number, code: string): AxiosError => {
  const config = { headers: new AxiosHeaders() };

  return new AxiosError("request failed", "ERR_BAD_REQUEST", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data: { isSuccess: false, code, message: "", data: null },
  });
};

const TREE_TAGS: TreeTag[] = [{ id: "7", name: "남은 태그" }]; // 8번 태그는 지운 뒤 트리에서 사라졌다.

/*
삭제를 되돌릴 때 트리 태그 목록으로 지워진 태그를 거르므로, 목록을 cache에 미리 채워 첫 렌더부터 읽히게 한다.
*/
const renderUndoRedo = () => {
  const { wrapper, queryClient } = createQueryWrapper();

  vi.spyOn(tagApi, "getTreeTags").mockResolvedValue(TREE_TAGS);
  queryClient.setQueryData(treeQueryKeys.tags("10"), TREE_TAGS);

  return renderHook(() => useUndoRedo({ treeId: "10" }), { wrapper });
};

/*
c3 하위 트리를 지운 기록. c3은 원래 c1의 첫 번째 자식이었고 메모와 태그 7·8이 있었다.
*/
const createDeleteEntry = (): DeleteNodeEntry => {
  const [, , c3, c21] = useTreeStore.getState().nodes;
  const [, c1ToC3, c3ToC21] = useTreeStore.getState().edges;

  return {
    type: "delete",
    clientId: "c3",
    placement: { parentClientId: "c1", position: 1 },
    nodes: [
      { ...c3, data: { ...c3.data, memo: "지운 메모", tagIds: ["7", "8"] } },
      { ...c21, data: { ...c21.data, orderIndex: 3 } },
    ],
    edges: [c1ToC3, c3ToC21],
  };
};

const getChildClientIds = (parentClientId: string) => {
  const { nodes, edges } = useTreeStore.getState();
  const childClientIds = new Set(
    edges
      .filter((edge) => edge.source === parentClientId)
      .map((edge) => edge.target),
  );

  return nodes
    .filter((node) => childClientIds.has(node.id))
    .map((node) => node.id);
};

const createServerNode = (
  id: string,
  parentId: string,
  orderIndex: number,
) => ({
  id,
  parentId,
  label: `node ${id}`,
  orderIndex,
  memo: null,
  tagIds: [],
});

describe("useUndoRedo", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "10",
      nodes: [
        createNode("1", 1),
        createNode("2", 1),
        createNode("3", 2),
        createNode("21", 1),
      ],
      edges: [
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c3" }),
        createEditorEdge({ sourceClientId: "c3", targetClientId: "c21" }),
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useEditHistoryStore.getState().clear();
  });

  it("추가를 undo하면 하위 트리째 지우고 서버에 삭제를 요청한다", async () => {
    const deleteNodeSpy = vi
      .spyOn(treeApi, "deleteNode")
      .mockResolvedValue(undefined);
    useEditHistoryStore.getState().record(addEntry);
    const { result } = renderUndoRedo();

    act(() => result.current.handleUndo());

    expect(getNodeById("c3")).toBeUndefined();
    expect(getNodeById("c21")).toBeUndefined();
    await waitFor(() =>
      expect(deleteNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 3),
    );
    expect(getHistory()).toEqual({ past: [], future: [addEntry] });
  });

  /*
  서버는 삭제 뒤 순번을 다시 매기지 않으므로 처음 순번이 아니라 지금 형제의 맨 끝으로 다시 만든다.
  */
  it("추가를 redo하면 같은 신원으로 형제 맨 끝에 다시 만들고 새 서버 ID를 채운다", async () => {
    useTreeStore.getState().deleteNodeFromStore(["c3", "c21"]);
    useEditHistoryStore.getState().record(addEntry);
    useEditHistoryStore.getState().takeUndo();
    const createNodeSpy = vi.spyOn(treeApi, "createNode").mockResolvedValue({
      id: "99",
      parentId: "1",
      label: "node 3",
      orderIndex: 2,
      memo: null,
      tagIds: [],
    });
    const { result } = renderUndoRedo();

    act(() => result.current.handleRedo());

    expect(getParentClientId("c3")).toBe("c1");
    await waitFor(() => expect(getNodeById("c3")?.data.serverId).toBe("99"));
    expect(createNodeSpy).toHaveBeenCalledExactlyOnceWith(10, {
      name: "node 3",
      parentId: 1,
      orderId: 2,
    });
    expect(getHistory()).toEqual({ past: [addEntry], future: [] });
  });

  /*
  추가한 뒤 고친 제목·메모·태그는 기록에 남지 않는다. 지울 때 기록을 고쳐 쓰지 않으면 redo가 처음 추가할 때의 값으로 만든다.
  */
  it("추가를 undo하면 지우기 직전의 제목·메모·태그로 기록을 고쳐 쓴다", async () => {
    vi.spyOn(treeApi, "deleteNode").mockResolvedValue(undefined);
    useEditHistoryStore.getState().record(addEntry);
    const {
      updateNodeLabelInStore,
      updateNodeMemoInStore,
      addTagToNodeInStore,
    } = useTreeStore.getState();
    updateNodeLabelInStore("c3", "고친 제목");
    updateNodeMemoInStore("c3", "쓴 메모");
    addTagToNodeInStore("c3", "7");
    const { result } = renderUndoRedo();

    act(() => result.current.handleUndo());

    await waitFor(() =>
      expect(getHistory().future).toEqual([
        { ...addEntry, label: "고친 제목", memo: "쓴 메모", tagIds: ["7"] },
      ]),
    );
  });

  it("추가를 redo하면 기록의 메모와 남은 태그를 되살린다", async () => {
    useTreeStore.getState().deleteNodeFromStore(["c3", "c21"]);
    const entry: AddNodeEntry = {
      ...addEntry,
      memo: "쓴 메모",
      tagIds: ["7", "8"],
    };
    useEditHistoryStore.getState().record(entry);
    useEditHistoryStore.getState().takeUndo();
    vi.spyOn(treeApi, "createNode").mockResolvedValue(
      createServerNode("99", "1", 2),
    );
    const updateMemoSpy = vi
      .spyOn(memoApi, "updateMemo")
      .mockResolvedValue({ title: "node 3", content: "쓴 메모" });
    const addNodeTagSpy = vi
      .spyOn(tagApi, "addNodeTag")
      .mockResolvedValue(TREE_TAGS[0]);
    const { result } = renderUndoRedo();

    act(() => result.current.handleRedo());

    await waitFor(() =>
      expect(getHistory()).toEqual({ past: [entry], future: [] }),
    );
    expect(updateMemoSpy).toHaveBeenCalledExactlyOnceWith(99, {
      content: "쓴 메모",
    });
    expect(addNodeTagSpy).toHaveBeenCalledExactlyOnceWith(99, 7);
    expect(getNodeById("c3")?.data).toMatchObject({
      serverId: "99",
      memo: "쓴 메모",
      tagIds: ["7"],
    });
  });

  it("이동을 undo하면 옮기기 전 자리로, redo하면 같은 목적지로 이동을 요청한다", async () => {
    const moveNodeSpy = vi
      .spyOn(treeApi, "moveNode")
      .mockResolvedValue({ siblings: [], previousSiblings: [] });
    useEditHistoryStore.getState().record(moveEntry);
    const { result } = renderUndoRedo();

    act(() => result.current.handleUndo());

    expect(getParentClientId("c21")).toBe("c2");
    await waitFor(() =>
      expect(moveNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 21, {
        parentId: 2,
        position: 1,
      }),
    );
    await waitFor(() => expect(result.current.isUndoingOrRedoing).toBe(false));

    act(() => result.current.handleRedo());

    expect(getParentClientId("c21")).toBe("c3");
    await waitFor(() =>
      expect(moveNodeSpy).toHaveBeenLastCalledWith(10, 21, {
        parentId: 3,
        position: 1,
      }),
    );
    await waitFor(() =>
      expect(getHistory()).toEqual({ past: [moveEntry], future: [] }),
    );
  });

  it("서버가 거절하면 요청 전 구조로 되돌리고 기록도 돌려놓는다", async () => {
    vi.spyOn(treeApi, "moveNode").mockRejectedValue(new Error("failed"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { nodes: initialNodes, edges: initialEdges } =
      useTreeStore.getState();
    useEditHistoryStore.getState().record(moveEntry);
    const { result } = renderUndoRedo();

    act(() => result.current.handleUndo());

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
        "되돌리기에 실패했습니다.",
      ),
    );
    expect(useTreeStore.getState().nodes).toEqual(initialNodes);
    expect(useTreeStore.getState().edges).toEqual(initialEdges);
    expect(getHistory()).toEqual({ past: [moveEntry], future: [] });
  });

  /*
  pending 값은 리렌더 전 클릭을 막지 못한다. 막지 못하면 두 번째 클릭이 앞 기록을 꺼내 요청이 겹친다.
  */
  /*
  편집기를 벗어나면 store는 비워지고 다음 편집기의 트리로 채워진다. 그 뒤에 도착한 실패로 이전 트리의 구조를 되돌리면 새 트리를 덮는다.
  */
  it("요청 중에 편집기를 벗어난 뒤 실패하면 store를 되돌리지 않고 알리지도 않는다", async () => {
    useEditHistoryStore.getState().record(moveEntry);
    let rejectMove: (error: Error) => void = () => {};
    vi.spyOn(treeApi, "moveNode").mockReturnValue(
      new Promise((_, reject) => {
        rejectMove = reject;
      }),
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result, unmount } = renderUndoRedo();

    act(() => result.current.handleUndo());
    await waitFor(() => expect(treeApi.moveNode).toHaveBeenCalled());

    unmount();
    useTreeStore.getState().resetTree();
    useEditHistoryStore.getState().clear();
    useTreeStore.getState().initializeTree({
      treeId: "20",
      nodes: [createNode("9", 1)],
      edges: [],
    });
    const { nodes: nextNodes, edges: nextEdges } = useTreeStore.getState();

    await act(async () => rejectMove(new Error("failed")));

    expect(useTreeStore.getState().nodes).toBe(nextNodes);
    expect(useTreeStore.getState().edges).toBe(nextEdges);
    expect(getHistory()).toEqual({ past: [], future: [] });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("요청 중에 다시 눌러도 다음 기록을 꺼내지 않는다", async () => {
    const deleteNodeSpy = vi
      .spyOn(treeApi, "deleteNode")
      .mockImplementation(() => new Promise(() => {}));
    useEditHistoryStore.getState().record(moveEntry);
    useEditHistoryStore.getState().record(addEntry);
    const { result } = renderUndoRedo();

    act(() => {
      result.current.handleUndo();
      result.current.handleUndo();
    });

    await waitFor(() => expect(deleteNodeSpy).toHaveBeenCalledOnce());
    expect(getHistory()).toEqual({ past: [moveEntry], future: [addEntry] });
  });
  describe("삭제", () => {
    /*
    원래 순번은 그 사이 다른 노드가 차지했을 수 있어 맨 끝에 만든 뒤 옮긴다. 자식은 새로 만든 부모 밑이라 원래 순번을 쓴다.
    */
    it("undo하면 하위 트리 루트를 맨 끝에 만들어 원래 자리로 옮기고, 하위 노드·메모·남은 태그를 되살린다", async () => {
      const entry = createDeleteEntry();
      useTreeStore.getState().deleteNodeFromStore(["c3", "c21"]);
      useEditHistoryStore.getState().record(entry);
      const createNodeSpy = vi
        .spyOn(treeApi, "createNode")
        .mockResolvedValueOnce(createServerNode("30", "1", 2))
        .mockResolvedValueOnce(createServerNode("210", "30", 3));
      const moveNodeSpy = vi.spyOn(treeApi, "moveNode").mockResolvedValue({
        siblings: [
          createServerNode("30", "1", 1),
          createServerNode("2", "1", 2),
        ],
        previousSiblings: [],
      });
      const updateMemoSpy = vi
        .spyOn(memoApi, "updateMemo")
        .mockResolvedValue({ title: "node 3", content: "지운 메모" });
      const addNodeTagSpy = vi
        .spyOn(tagApi, "addNodeTag")
        .mockResolvedValue(TREE_TAGS[0]);
      const { result } = renderUndoRedo();

      act(() => result.current.handleUndo());

      expect(getChildClientIds("c1")).toEqual(["c3", "c2"]);
      await waitFor(() =>
        expect(getHistory()).toEqual({ past: [], future: [entry] }),
      );
      expect(createNodeSpy.mock.calls).toEqual([
        [10, { name: "node 3", parentId: 1, orderId: 2 }],
        [10, { name: "node 21", parentId: 30, orderId: 3 }],
      ]);
      expect(moveNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 30, {
        parentId: 1,
        position: 1,
      });
      expect(updateMemoSpy).toHaveBeenCalledExactlyOnceWith(30, {
        content: "지운 메모",
      });
      expect(addNodeTagSpy).toHaveBeenCalledExactlyOnceWith(30, 7);
      expect(getNodeById("c3")?.data).toMatchObject({
        serverId: "30",
        memo: "지운 메모",
        tagIds: ["7"],
      });
      expect(getNodeById("c21")?.data.serverId).toBe("210");
      expect(getParentClientId("c21")).toBe("c3");
      expect(getChildClientIds("c1")).toEqual(["c3", "c2"]);
    });

    /*
    트리 태그 목록이 낡아 7번이 남은 것처럼 보이지만, 서버에서는 이미 지워져 TAG404-1로 거절된다.
    */
    it("서버가 지워진 태그라고 거절하면 그 태그만 빼고 되살리기를 마친다", async () => {
      const entry = createDeleteEntry();
      useTreeStore.getState().deleteNodeFromStore(["c3", "c21"]);
      useEditHistoryStore.getState().record(entry);
      vi.spyOn(treeApi, "createNode")
        .mockResolvedValueOnce(createServerNode("30", "1", 2))
        .mockResolvedValueOnce(createServerNode("210", "30", 3));
      vi.spyOn(treeApi, "moveNode").mockResolvedValue({
        siblings: [
          createServerNode("30", "1", 1),
          createServerNode("2", "1", 2),
        ],
        previousSiblings: [],
      });
      vi.spyOn(memoApi, "updateMemo").mockResolvedValue({
        title: "node 3",
        content: "지운 메모",
      });
      vi.spyOn(tagApi, "addNodeTag").mockRejectedValue(
        createApiError(404, "TAG404-1"),
      );
      const deleteNodeSpy = vi.spyOn(treeApi, "deleteNode");
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { result } = renderUndoRedo();

      act(() => result.current.handleUndo());

      await waitFor(() =>
        expect(getNodeById("c21")?.data.serverId).toBe("210"),
      );
      expect(getNodeById("c3")?.data).toMatchObject({
        serverId: "30",
        memo: "지운 메모",
        tagIds: [],
      });
      expect(getHistory()).toEqual({ past: [], future: [entry] });
      expect(deleteNodeSpy).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it("되살리는 도중 실패하면 만든 하위 트리 루트를 지우고 지운 상태로 되돌린다", async () => {
      const entry = createDeleteEntry();
      useTreeStore.getState().deleteNodeFromStore(["c3", "c21"]);
      const { nodes: deletedNodes, edges: deletedEdges } =
        useTreeStore.getState();
      useEditHistoryStore.getState().record(entry);
      vi.spyOn(treeApi, "createNode")
        .mockResolvedValueOnce(createServerNode("30", "1", 2))
        .mockRejectedValueOnce(new Error("failed"));
      vi.spyOn(treeApi, "moveNode").mockResolvedValue({
        siblings: [],
        previousSiblings: [],
      });
      vi.spyOn(memoApi, "updateMemo").mockResolvedValue({
        title: "node 3",
        content: "지운 메모",
      });
      vi.spyOn(tagApi, "addNodeTag").mockResolvedValue(TREE_TAGS[0]);
      const deleteNodeSpy = vi
        .spyOn(treeApi, "deleteNode")
        .mockResolvedValue(undefined);
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { result } = renderUndoRedo();

      act(() => result.current.handleUndo());

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
          "되돌리기에 실패했습니다.",
        ),
      );
      expect(deleteNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 30);
      expect(useTreeStore.getState().nodes).toEqual(deletedNodes);
      expect(useTreeStore.getState().edges).toEqual(deletedEdges);
      expect(getHistory()).toEqual({ past: [entry], future: [] });
    });

    /*
    정리 삭제까지 실패하면 서버에 만든 루트가 남는다. 기록을 돌려놓으면 다음 undo가 같은 하위 트리를 또 만들므로 기록을 비운다.
    */
    it("정리 요청까지 실패하면 지운 상태로 되돌리고, 기록을 비우고 새로고침을 안내한다", async () => {
      const entry = createDeleteEntry();
      useTreeStore.getState().deleteNodeFromStore(["c3", "c21"]);
      const { nodes: deletedNodes, edges: deletedEdges } =
        useTreeStore.getState();
      useEditHistoryStore.getState().record(moveEntry);
      useEditHistoryStore.getState().record(entry);
      vi.spyOn(treeApi, "createNode")
        .mockResolvedValueOnce(createServerNode("30", "1", 2))
        .mockRejectedValueOnce(new Error("failed"));
      vi.spyOn(treeApi, "moveNode").mockResolvedValue({
        siblings: [],
        previousSiblings: [],
      });
      vi.spyOn(memoApi, "updateMemo").mockResolvedValue({
        title: "node 3",
        content: "지운 메모",
      });
      vi.spyOn(tagApi, "addNodeTag").mockResolvedValue(TREE_TAGS[0]);
      const deleteNodeSpy = vi
        .spyOn(treeApi, "deleteNode")
        .mockRejectedValue(new Error("cleanup failed"));
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { result } = renderUndoRedo();

      act(() => result.current.handleUndo());

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
          "되돌리기에 실패했습니다. 일부 노드가 서버에 남았을 수 있으니 새로고침해 주세요.",
        ),
      );
      expect(deleteNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 30);
      expect(useTreeStore.getState().nodes).toEqual(deletedNodes);
      expect(useTreeStore.getState().edges).toEqual(deletedEdges);
      expect(getHistory()).toEqual({ past: [], future: [] });
    });

    /*
    루트를 옮기면 서버가 형제 순번을 다시 매긴다(c3 → 1, c2 → 2). 정리 삭제 뒤에는 다시 매기지 않으므로 서버의 c2는 2로 남는다.
    store를 요청 전 순번(c2 → 1)으로 되돌리면 다음 추가가 2를 보내 서버의 c2와 겹친다.
    */
    it("루트를 옮긴 뒤 실패하면 서버가 다시 매긴 형제 순번으로 맞춘다", async () => {
      const entry = createDeleteEntry();
      useTreeStore.getState().deleteNodeFromStore(["c3", "c21"]);
      useEditHistoryStore.getState().record(entry);
      vi.spyOn(treeApi, "createNode").mockResolvedValueOnce(
        createServerNode("30", "1", 2),
      );
      vi.spyOn(treeApi, "moveNode").mockResolvedValue({
        siblings: [
          createServerNode("30", "1", 1),
          createServerNode("2", "1", 2),
        ],
        previousSiblings: [],
      });
      vi.spyOn(memoApi, "updateMemo").mockRejectedValue(new Error("failed"));
      const deleteNodeSpy = vi
        .spyOn(treeApi, "deleteNode")
        .mockResolvedValue(undefined);
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { result } = renderUndoRedo();

      act(() => result.current.handleUndo());

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
          "되돌리기에 실패했습니다.",
        ),
      );
      expect(deleteNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 30);
      expect(getChildClientIds("c1")).toEqual(["c2"]);
      expect(getNodeById("c2")?.data.orderIndex).toBe(2);
      expect(getHistory()).toEqual({ past: [entry], future: [] });
    });

    /*
    되살린 뒤 고친 메모는 기록에 남지 않는다. 다시 지울 때 기록을 고쳐 쓰지 않으면 다음 undo가 처음 지운 시점의 메모로 되살린다.
    */
    it("redo하면 다시 지우고, 기록을 지우기 직전 값으로 고쳐 쓴다", async () => {
      const entry = createDeleteEntry();
      useEditHistoryStore.getState().record(entry);
      useEditHistoryStore.getState().takeUndo();
      useTreeStore.getState().updateNodeMemoInStore("c3", "고친 메모");
      const deleteNodeSpy = vi
        .spyOn(treeApi, "deleteNode")
        .mockResolvedValue(undefined);
      const { result } = renderUndoRedo();

      act(() => result.current.handleRedo());

      expect(getNodeById("c3")).toBeUndefined();
      expect(getNodeById("c21")).toBeUndefined();
      await waitFor(() => expect(getHistory().past[0]).not.toBe(entry));
      expect(deleteNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 3);
      expect(getHistory().future).toEqual([]);

      const [refreshedEntry] = getHistory().past as DeleteNodeEntry[];
      expect(refreshedEntry.nodes.map((node) => node.data.memo)).toEqual([
        "고친 메모",
        null,
      ]);
    });
  });
});
