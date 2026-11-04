import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { treeApi } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useEditHistoryStore } from "../../history/editHistoryStore";
import { useTreeStore } from "../../treeStore";
import { useDeleteNode } from "./useDeleteNode";

/*
1번 루트 밑에 2(1), 3(4)이 있고 2 밑에 21(1)이 있다. 3의 orderIndex 4는 삭제로 생긴 빈 번호 뒤의 값이다.
편집기 노드 ID는 "c" + 서버 ID로 둔다.
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

const getNodeById = (clientId: string) =>
  useTreeStore.getState().nodes.find((node) => node.id === clientId);

const renderDeleteNode = (selectedClientId: string) => {
  const { wrapper } = createQueryWrapper();

  return renderHook(
    () =>
      useDeleteNode({
        treeId: "10",
        selectedNode: getNodeById(selectedClientId),
      }),
    { wrapper },
  );
};

describe("useDeleteNode", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "10",
      nodes: [
        createNode("1", 1),
        createNode("2", 1),
        createNode("21", 1),
        createNode("3", 4),
      ],
      edges: [
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
        createEditorEdge({ sourceClientId: "c2", targetClientId: "c21" }),
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c3" }),
      ],
    });
    useEditHistoryStore.getState().clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useEditHistoryStore.getState().clear();
  });

  /*
  삭제를 되돌리는 요청이 아직 없어, 삭제 전 기록을 undo하면 지워진 노드를 가리키는 요청이 나간다.
  */
  it("삭제가 성공하면 undo 기록을 비운다", async () => {
    vi.spyOn(treeApi, "deleteNode").mockResolvedValue(undefined);
    useEditHistoryStore.getState().record({
      type: "add",
      clientId: "c21",
      parentClientId: "c2",
      label: "node 21",
    });
    const { result } = renderDeleteNode("c2");

    act(() => {
      result.current.handleDeleteNode();
    });

    await waitFor(() =>
      expect(useEditHistoryStore.getState().past).toHaveLength(0),
    );
  });

  /*
  요청 중에도 다른 노드의 제목은 고칠 수 있다. 복구가 삭제 전 값으로 통째로 덮으면 그 제목이 사라진다.
  */
  it("서버가 거절하면 하위 트리를 되살리고, 그 사이 바꾼 다른 노드의 제목은 둔다", async () => {
    let rejectDelete: (error: Error) => void = () => {};
    const deleteNodeSpy = vi.spyOn(treeApi, "deleteNode").mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const initialEdges = useTreeStore.getState().edges;
    const { result } = renderDeleteNode("c2");

    act(() => {
      result.current.handleDeleteNode();
    });

    expect(getNodeById("c2")).toBeUndefined();
    expect(getNodeById("c21")).toBeUndefined();

    // mutate는 요청을 다음 틱에 보내므로, 요청이 나간 뒤에 거절한다.
    await waitFor(() => expect(deleteNodeSpy).toHaveBeenCalledOnce());

    act(() => {
      useTreeStore.getState().updateNodeLabelInStore("c3", "renamed");
    });
    await act(async () => rejectDelete(new Error("delete failed")));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
        "노드 삭제에 실패했습니다.",
      ),
    );
    expect(
      useTreeStore
        .getState()
        .nodes.map((node) => `${node.id}:${node.data.orderIndex}`),
    ).toEqual(["c1:1", "c2:1", "c21:1", "c3:4"]);
    expect(useTreeStore.getState().edges).toEqual(initialEdges);
    expect(getNodeById("c3")?.data.label).toBe("renamed");
    expect(useEditHistoryStore.getState().past).toHaveLength(0);
  });
});
