import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { treeApi } from "@/src/entities/tree";
import {
  workspaceApi,
  workspaceQueryKeys,
  type WorkspaceDetail,
} from "@/src/entities/workspace";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useAddRootNode } from "./useAddRootNode";

const EMPTY_WORKSPACE: WorkspaceDetail = {
  id: "2",
  name: "Workspace In Folder",
  updatedAt: "2026-08-30T09:00:00",
  treeId: null,
};

const renderAddRootNode = (workspaceId: string, treeId: string | null) => {
  const { queryClient, wrapper } = createQueryWrapper();
  queryClient.setQueryData(workspaceQueryKeys.detail(workspaceId), {
    ...EMPTY_WORKSPACE,
    id: workspaceId,
    treeId,
  });

  const rendered = renderHook(
    () =>
      useAddRootNode({
        workspaceId,
        treeId,
        nodes: useTreeStore((state) => state.nodes),
      }),
    { wrapper },
  );

  return { ...rendered, queryClient };
};

const getCachedTreeId = (
  queryClient: ReturnType<typeof createQueryWrapper>["queryClient"],
  workspaceId: string,
) =>
  queryClient.getQueryData<WorkspaceDetail>(
    workspaceQueryKeys.detail(workspaceId),
  )?.treeId;

describe("useAddRootNode", () => {
  beforeEach(() => {
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("트리가 있을 때", () => {
    it("트리를 만들지 않고 서버가 확정한 루트 노드를 엣지 없이 store에 넣는다", async () => {
      const createTreeSpy = vi.spyOn(workspaceApi, "createWorkspaceTree");
      const { result } = renderAddRootNode("2", "20");

      await act(() => result.current.handleAddRootNode());

      const { treeId, nodes, edges } = useTreeStore.getState();
      expect(createTreeSpy).not.toHaveBeenCalled();
      expect(treeId).toBe("20");
      expect(nodes.map((node) => node.data)).toEqual([
        { serverId: "500", label: "Root Node", orderIndex: 1, memo: null },
      ]);
      expect(edges).toEqual([]);
    });

    /*
    루트는 지울 수 없으므로 추가를 되돌릴 수 있으면 서버에 루트가 남은 채 store만 비게 된다.
    */
    it("루트를 추가한 뒤에는 되돌릴 기록이 남지 않는다", async () => {
      const { result } = renderAddRootNode("2", "20");

      await act(() => result.current.handleAddRootNode());

      expect(useTreeStore.getState().nodes).toHaveLength(1);
      expect(useTreeStore.temporal.getState().pastStates).toEqual([]);
    });

    it("노드가 이미 있으면 요청하지 않는다", async () => {
      const createNodeSpy = vi.spyOn(treeApi, "createNode");
      useTreeStore.setState({
        nodes: [
          createEditorNode({
            clientId: "client-1",
            serverId: "1",
            label: "Root Node",
            orderIndex: 1,
            x: 0,
            y: 0,
          }),
        ],
      });
      const { result } = renderAddRootNode("2", "20");

      await act(() => result.current.handleAddRootNode());

      expect(createNodeSpy).not.toHaveBeenCalled();
    });

    it("다른 곳에서 루트가 먼저 생겼으면 새로고침을 안내하고 store는 그대로 둔다", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { result } = renderAddRootNode("1", "10");

      await act(() => result.current.handleAddRootNode());

      expect(alertSpy).toHaveBeenCalledWith(
        "이미 루트 노드가 있습니다. 새로고침 후 다시 시도해주세요.",
      );
      expect(useTreeStore.getState().nodes).toEqual([]);
    });
  });

  describe("트리가 없을 때", () => {
    it("트리를 만든 뒤 루트 노드를 넣고, 상세 캐시에 treeId를 채운다", async () => {
      const { result, queryClient } = renderAddRootNode("2", null);

      await act(() => result.current.handleAddRootNode());

      expect(useTreeStore.getState().treeId).toBe("20");
      expect(useTreeStore.getState().nodes).toHaveLength(1);
      expect(getCachedTreeId(queryClient, "2")).toBe("20");
    });

    /*
    캐시가 먼저 바뀌면 페이지가 트리 조회를 시작해 루트 생성과 겹치고, 루트가 store에 두 번 들어갈 수 있다.
    */
    it("상세 캐시의 treeId는 store에 루트가 들어간 뒤에 바뀐다", async () => {
      const { result, queryClient } = renderAddRootNode("2", null);
      const nodeCountsWhenCacheChanged: number[] = [];

      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === "updated" &&
          event.query.queryHash ===
            JSON.stringify(workspaceQueryKeys.detail("2")) &&
          getCachedTreeId(queryClient, "2") === "20"
        ) {
          nodeCountsWhenCacheChanged.push(useTreeStore.getState().nodes.length);
        }
      });

      await act(() => result.current.handleAddRootNode());
      unsubscribe();

      expect(nodeCountsWhenCacheChanged[0]).toBe(1);
    });

    it("루트 노드 생성이 실패해도 트리는 생겼으므로 상세 캐시에 treeId를 채운다", async () => {
      vi.spyOn(window, "alert").mockImplementation(() => {});
      server.use(
        http.post("*/api/trees/:treeId/nodes", () =>
          HttpResponse.json(
            { isSuccess: false, code: "COMMON500", message: "", data: null },
            { status: 500 },
          ),
        ),
      );
      const { result, queryClient } = renderAddRootNode("2", null);

      await act(() => result.current.handleAddRootNode());

      expect(useTreeStore.getState().nodes).toEqual([]);
      expect(getCachedTreeId(queryClient, "2")).toBe("20");
    });

    it("다른 곳에서 트리가 먼저 생겼으면 안내하고 상세 캐시를 무효화한다", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const createNodeSpy = vi.spyOn(treeApi, "createNode");
      const { result, queryClient } = renderAddRootNode("1", null);

      await act(() => result.current.handleAddRootNode());

      expect(alertSpy).toHaveBeenCalledWith(
        "이미 트리가 만들어진 워크스페이스입니다. 잠시 후 다시 시도해주세요.",
      );
      expect(createNodeSpy).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(
          queryClient.getQueryState(workspaceQueryKeys.detail("1"))
            ?.isInvalidated,
        ).toBe(true),
      );
    });
  });
});
