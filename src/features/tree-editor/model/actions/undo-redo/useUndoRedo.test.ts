import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { treeApi } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import {
  type AddNodeEntry,
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

const renderUndoRedo = () => {
  const { wrapper } = createQueryWrapper();

  return renderHook(() => useUndoRedo({ treeId: "10" }), { wrapper });
};

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
});
