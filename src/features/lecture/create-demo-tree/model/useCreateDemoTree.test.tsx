import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { treeApi, type CreateNodeRequest } from "@/src/entities/tree";
import { workspaceApi } from "@/src/entities/workspace";
import { useCreateDemoTree } from "./useCreateDemoTree";

const DEMO_TREE = {
  name: "루트",
  children: [{ name: "첫째", children: [{ name: "손자" }] }, { name: "둘째" }],
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const mockCreateWorkspace = () => {
  vi.spyOn(workspaceApi, "createWorkspace").mockResolvedValue({
    id: "7",
  } as Awaited<ReturnType<typeof workspaceApi.createWorkspace>>);
  vi.spyOn(workspaceApi, "createWorkspaceTree").mockResolvedValue("9");
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCreateDemoTree", () => {
  it("부모의 서버 ID로 자식을 만들고 형제 순서를 1부터 매긴다", async () => {
    mockCreateWorkspace();

    let nextNodeId = 100;
    const createNode = vi
      .spyOn(treeApi, "createNode")
      .mockImplementation(async (_treeId: number, body: CreateNodeRequest) => ({
        id: String(nextNodeId++),
        parentId: body.parentId === null ? null : String(body.parentId),
        label: body.name,
        orderIndex: body.orderId,
        memo: null,
        tagIds: [],
      }));

    const { result } = renderHook(() => useCreateDemoTree(), { wrapper });

    const workspaceId = await act(() => result.current.mutateAsync(DEMO_TREE));

    expect(workspaceId).toBe("7");
    expect(workspaceApi.createWorkspace).toHaveBeenCalledWith({
      name: "루트",
      folderId: null,
    });
    expect(createNode.mock.calls).toEqual([
      [9, { name: "루트", parentId: null, orderId: 1 }],
      [9, { name: "첫째", parentId: 100, orderId: 1 }],
      [9, { name: "손자", parentId: 101, orderId: 1 }],
      [9, { name: "둘째", parentId: 100, orderId: 2 }],
    ]);
  });

  it("노드 생성이 실패하면 남은 노드를 만들지 않고 실패를 알린다", async () => {
    mockCreateWorkspace();

    const createNode = vi
      .spyOn(treeApi, "createNode")
      .mockRejectedValue(new Error("실패"));

    const { result } = renderHook(() => useCreateDemoTree(), { wrapper });

    await expect(
      act(() => result.current.mutateAsync(DEMO_TREE)),
    ).rejects.toThrow("실패");

    expect(createNode).toHaveBeenCalledTimes(1);
  });
});
