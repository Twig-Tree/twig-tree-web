import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { NODE_ERROR_CODE, treeApi, type TreeNode } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { createEditorEdge } from "../../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useEditHistoryStore } from "../../history/editHistoryStore";
import { useTreeStore } from "../../treeStore";
import { useMoveNode } from "./useMoveNode";

/*
MSW의 10번 트리(RAW_TREE_DATA)와 같은 모양이다. 2번 노드 밑에 21, 22, 23이 있고 1번 노드 밑에 2, 3이 있다.
편집기 노드 ID는 "c" + 서버 ID로 둔다.
*/
const createNode = (serverId: string | null, orderIndex: number, id = "") =>
  createEditorNode({
    clientId: id || `c${serverId}`,
    serverId,
    label: `node ${serverId}`,
    orderIndex,
    x: 0,
    y: 0,
  });

const createEdge = (sourceClientId: string, targetClientId: string) =>
  createEditorEdge({ sourceClientId, targetClientId });

const createServerNode = (id: string, orderIndex: number): TreeNode => ({
  id,
  parentId: "2",
  label: `node ${id}`,
  orderIndex,
  memo: null,
  version: 0,
  tagIds: [],
});

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

const renderMoveNode = () => {
  const { wrapper } = createQueryWrapper();

  return renderHook(() => useMoveNode({ treeId: "10" }), { wrapper });
};

describe("useMoveNode", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "10",
      nodes: [
        createNode("1", 0),
        createNode("2", 1),
        createNode("21", 2),
        createNode("22", 3),
        createNode("23", 4),
        createNode("3", 6),
        createNode(null, 7, "unsaved"),
      ],
      edges: [
        createEdge("c1", "c2"),
        createEdge("c2", "c21"),
        createEdge("c2", "c22"),
        createEdge("c2", "c23"),
        createEdge("c1", "c3"),
        createEdge("c1", "unsaved"),
      ],
    });
    useEditHistoryStore.getState().clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useEditHistoryStore.getState().clear();
  });

  it("editor store에 먼저 옮기고 서버 ID로 이동을 요청한다", async () => {
    const moveNodeSpy = vi.spyOn(treeApi, "moveNode");
    const { result } = renderMoveNode();

    act(() => {
      result.current.moveNode({
        clientId: "c23",
        parentClientId: "c2",
        position: 1,
      });
    });

    expect(getChildClientIds("c2")).toEqual(["c23", "c21", "c22"]);
    await waitFor(() =>
      expect(moveNodeSpy).toHaveBeenCalledExactlyOnceWith(10, 23, {
        parentId: 2,
        position: 1,
      }),
    );

    /*
    isMovingNode는 요청 전에도 false라 그것만 기다리면 응답 전에 통과한다. 요청의 응답과 그 뒤 렌더를 기다린다.
    */
    await act(() => moveNodeSpy.mock.results[0].value);
    await waitFor(() => expect(result.current.isMovingNode).toBe(false));

    expect(getChildClientIds("c2")).toEqual(["c23", "c21", "c22"]);
    expect(useEditHistoryStore.getState().past).toEqual([
      {
        type: "move",
        clientId: "c23",
        from: { parentClientId: "c2", position: 3 },
        to: { parentClientId: "c2", position: 1 },
      },
    ]);
  });

  it("응답의 형제 순서가 다르면 서버 순서로 맞춘다", async () => {
    vi.spyOn(treeApi, "moveNode").mockResolvedValue({
      siblings: [
        createServerNode("22", 1),
        createServerNode("23", 2),
        createServerNode("21", 3),
      ],
      previousSiblings: [],
    });
    const { result } = renderMoveNode();

    act(() => {
      result.current.moveNode({
        clientId: "c23",
        parentClientId: "c2",
        position: 1,
      });
    });

    await waitFor(() =>
      expect(getChildClientIds("c2")).toEqual(["c22", "c23", "c21"]),
    );
  });

  it("서버가 거절하면 이동 전 구조로 되돌리고 사유를 알린다", async () => {
    server.use(
      http.patch("*/api/trees/:treeId/nodes/:nodeId/move", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: NODE_ERROR_CODE.INVALID_POSITION,
            message: "",
            data: null,
          },
          { status: 400 },
        ),
      ),
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderMoveNode();

    act(() => {
      result.current.moveNode({
        clientId: "c21",
        parentClientId: "c3",
        position: 1,
      });
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
        "트리가 다른 곳에서 바뀌었습니다. 새로고침한 뒤 다시 시도해 주세요.",
      ),
    );
    expect(getChildClientIds("c2")).toEqual(["c21", "c22", "c23"]);
    expect(getChildClientIds("c3")).toEqual([]);
    expect(useEditHistoryStore.getState().past).toHaveLength(0);
  });

  it("저장되지 않은 노드는 알리고 옮기지 않는다", () => {
    const moveNodeSpy = vi.spyOn(treeApi, "moveNode");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderMoveNode();

    act(() => {
      result.current.moveNode({
        clientId: "unsaved",
        parentClientId: "c2",
        position: 1,
      });
    });

    expect(alertSpy).toHaveBeenCalledOnce();
    expect(moveNodeSpy).not.toHaveBeenCalled();
    expect(getChildClientIds("c2")).toEqual(["c21", "c22", "c23"]);
  });

  it("같은 자리로는 요청하지 않는다", () => {
    const moveNodeSpy = vi.spyOn(treeApi, "moveNode");
    const { result } = renderMoveNode();

    act(() => {
      result.current.moveNode({
        clientId: "c22",
        parentClientId: "c2",
        position: 2,
      });
    });

    expect(moveNodeSpy).not.toHaveBeenCalled();
    expect(useEditHistoryStore.getState().past).toHaveLength(0);
  });
});
