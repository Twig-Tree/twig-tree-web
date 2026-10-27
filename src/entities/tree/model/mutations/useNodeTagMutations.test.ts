import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { tagApi } from "../../api/tagApi";
import { treeQueryKeys } from "../queryKeys";
import { TreeNode } from "../types";
import { useAddNodeTagMutation } from "./useAddNodeTagMutation";
import { useRemoveNodeTagMutation } from "./useRemoveNodeTagMutation";

const createTreeNode = (id: string, tagIds: string[]): TreeNode => ({
  id,
  parentId: null,
  label: `node ${id}`,
  orderIndex: 0,
  memo: null,
  tagIds,
});

describe("useAddNodeTagMutation", () => {
  it("숫자 ID로 요청하고, 트리 조회 캐시의 그 노드 tagIds 끝에 태그를 덧붙인다", async () => {
    const addNodeTagSpy = vi.spyOn(tagApi, "addNodeTag");
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.detail("10"), [
      createTreeNode("1", ["2"]),
      createTreeNode("2", []),
    ]);
    const { result } = renderHook(() => useAddNodeTagMutation(), { wrapper });

    result.current.mutate({ treeId: "10", nodeId: "1", tagId: "1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addNodeTagSpy).toHaveBeenCalledWith(1, 1);
    expect(queryClient.getQueryData(treeQueryKeys.detail("10"))).toEqual([
      createTreeNode("1", ["2", "1"]),
      createTreeNode("2", []),
    ]);
  });
});

describe("useRemoveNodeTagMutation", () => {
  it("트리 조회 캐시의 그 노드 tagIds에서만 태그를 뺀다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.detail("10"), [
      createTreeNode("1", ["1", "2"]),
      createTreeNode("2", ["1"]),
    ]);
    const { result } = renderHook(() => useRemoveNodeTagMutation(), {
      wrapper,
    });

    result.current.mutate({ treeId: "10", nodeId: "1", tagId: "1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(treeQueryKeys.detail("10"))).toEqual([
      createTreeNode("1", ["2"]),
      createTreeNode("2", ["1"]),
    ]);
  });
});
