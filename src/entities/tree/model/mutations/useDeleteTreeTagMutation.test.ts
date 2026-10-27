import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { treeQueryKeys } from "../queryKeys";
import { TreeNode } from "../types";
import { useDeleteTreeTagMutation } from "./useDeleteTreeTagMutation";

const createTreeNode = (id: string, tagIds: string[]): TreeNode => ({
  id,
  parentId: null,
  label: `node ${id}`,
  orderIndex: 0,
  memo: null,
  tagIds,
});

describe("useDeleteTreeTagMutation", () => {
  /*
  백엔드가 노드와의 연결도 함께 지우므로, 트리 조회 캐시에 지운 태그 ID가 남으면 다음 진입 때 없는 태그가 노드에 실린다.
  */
  it("트리 태그 목록과 모든 노드의 tagIds에서 지운 태그를 뺀다", async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.tags("10"), [
      { id: "1", name: "React" },
      { id: "2", name: "TypeScript" },
    ]);
    queryClient.setQueryData(treeQueryKeys.detail("10"), [
      createTreeNode("1", ["1", "2"]),
      createTreeNode("2", ["2"]),
    ]);
    const { result } = renderHook(() => useDeleteTreeTagMutation(), {
      wrapper,
    });

    result.current.mutate({ treeId: "10", tagId: "2" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(treeQueryKeys.tags("10"))).toEqual([
      { id: "1", name: "React" },
    ]);
    expect(queryClient.getQueryData(treeQueryKeys.detail("10"))).toEqual([
      createTreeNode("1", ["1"]),
      createTreeNode("2", []),
    ]);
  });
});
