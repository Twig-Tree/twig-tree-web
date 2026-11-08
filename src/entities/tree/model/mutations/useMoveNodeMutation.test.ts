import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { isAxiosError } from "axios";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { RAW_TREE_DATA } from "@/src/tests/mocks/data";
import { treeApi } from "../../api/treeApi";
import { mapNodesDtoToDomain } from "../../lib/mappers";
import { NODE_ERROR_CODE } from "../constants";
import { treeQueryKeys } from "../queryKeys";
import { TreeNode } from "../types";
import { useMoveNodeMutation } from "./useMoveNodeMutation";

/*
RAW_TREE_DATA의 2번 노드 밑에는 21(2), 22(3), 23(4)이 있고 23 밑에 24가 있다. 1번 노드 밑에는 2(1), 3(6)이 있다.
*/
const TREE_ID = "10";

/*
함수 이름 : getCachedNode
기능 : 트리 조회 캐시에서 노드 하나를 찾는다.
인자 : TreeNode[] | undefined nodes -> 트리 조회 캐시
string nodeId -> 찾을 노드 ID
반환값 : 찾은 노드. 없으면 undefined
*/
const getCachedNode = (nodes: TreeNode[] | undefined, nodeId: string) =>
  nodes?.find((node) => node.id === nodeId);

describe("useMoveNodeMutation", () => {
  it("숫자 ID로 요청하고, 같은 부모 안 이동이면 그 형제들의 orderIndex를 응답대로 바꾼다", async () => {
    const moveNodeSpy = vi.spyOn(treeApi, "moveNode");
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(
      treeQueryKeys.detail(TREE_ID),
      mapNodesDtoToDomain(RAW_TREE_DATA),
    );
    const { result } = renderHook(() => useMoveNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: TREE_ID,
      nodeId: "23",
      parentId: "2",
      position: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(moveNodeSpy).toHaveBeenCalledWith(10, 23, {
      parentId: 2,
      position: 1,
    });

    const cachedNodes = queryClient.getQueryData<TreeNode[]>(
      treeQueryKeys.detail(TREE_ID),
    );
    expect(
      ["23", "21", "22"].map(
        (nodeId) => getCachedNode(cachedNodes, nodeId)?.orderIndex,
      ),
    ).toEqual([1, 2, 3]);
    expect(cachedNodes).toHaveLength(RAW_TREE_DATA.length);
  });

  it("다른 부모로 옮기면 옮긴 노드의 parentId와 양쪽 형제의 orderIndex를 응답대로 바꾸고, 하위 노드는 그대로 둔다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(
      treeQueryKeys.detail(TREE_ID),
      mapNodesDtoToDomain(RAW_TREE_DATA),
    );
    const { result } = renderHook(() => useMoveNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: TREE_ID,
      nodeId: "23",
      parentId: "3",
      position: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cachedNodes = queryClient.getQueryData<TreeNode[]>(
      treeQueryKeys.detail(TREE_ID),
    );
    expect(getCachedNode(cachedNodes, "23")).toMatchObject({
      parentId: "3",
      orderIndex: 1,
    });
    expect(
      ["21", "22"].map(
        (nodeId) => getCachedNode(cachedNodes, nodeId)?.orderIndex,
      ),
    ).toEqual([1, 2]);
    expect(getCachedNode(cachedNodes, "24")).toMatchObject({
      parentId: "23",
      orderIndex: 5,
    });
  });

  /*
  다른 곳에서 만든 형제는 이 캐시에 없다. 서버가 확정한 노드이므로 캐시에 덧붙여 서버와 맞춘다.
  */
  it("응답에만 있는 형제 노드는 캐시 끝에 덧붙인다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(
      treeQueryKeys.detail(TREE_ID),
      mapNodesDtoToDomain(RAW_TREE_DATA.filter((dto) => dto.nodeId !== 21)),
    );
    const { result } = renderHook(() => useMoveNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: TREE_ID,
      nodeId: "23",
      parentId: "2",
      position: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cachedNodes = queryClient.getQueryData<TreeNode[]>(
      treeQueryKeys.detail(TREE_ID),
    );
    expect(cachedNodes?.at(-1)).toMatchObject({ id: "21", orderIndex: 2 });
    expect(cachedNodes).toHaveLength(RAW_TREE_DATA.length);
  });

  /*
  응답의 이름·메모·태그는 서버가 이동을 처리한 시점의 값이다. 그 사이 저장된 값이 캐시에 먼저 들어왔다면 덮지 않는다.
  */
  it("캐시에 있는 노드는 parentId와 orderIndex만 바꾸고 이름·메모·태그는 유지한다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(
      treeQueryKeys.detail(TREE_ID),
      mapNodesDtoToDomain(RAW_TREE_DATA).map((node) =>
        node.id === "23"
          ? { ...node, label: "새 이름", memo: "새 메모", tagIds: ["1"] }
          : node,
      ),
    );
    const { result } = renderHook(() => useMoveNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: TREE_ID,
      nodeId: "23",
      parentId: "3",
      position: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      getCachedNode(
        queryClient.getQueryData<TreeNode[]>(treeQueryKeys.detail(TREE_ID)),
        "23",
      ),
    ).toEqual({
      id: "23",
      parentId: "3",
      label: "새 이름",
      orderIndex: 1,
      memo: "새 메모",
      version: 0,
      tagIds: ["1"],
    });
  });

  it("하위 노드 밑으로 옮기면 NODE400-2로 실패하고 캐시를 바꾸지 않는다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    const initialNodes = mapNodesDtoToDomain(RAW_TREE_DATA);
    queryClient.setQueryData(treeQueryKeys.detail(TREE_ID), initialNodes);
    const { result } = renderHook(() => useMoveNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: TREE_ID,
      nodeId: "2",
      parentId: "24",
      position: 1,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const { error } = result.current;
    expect(isAxiosError(error) && error.response?.data.code).toBe(
      NODE_ERROR_CODE.INVALID_MOVE_TARGET,
    );
    expect(queryClient.getQueryData(treeQueryKeys.detail(TREE_ID))).toBe(
      initialNodes,
    );
  });
});
