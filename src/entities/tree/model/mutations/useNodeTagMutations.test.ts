import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { tagApi } from "../../api/tagApi";
import { TAG_ERROR_CODE } from "../constants";
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

/*
함수 이름 : respondWithError
기능 : 노드 태그 요청에 백엔드 오류 봉투로 응답하도록 MSW 핸들러를 덮는다.
인자 : "post" | "delete" method -> 덮을 요청 메서드
number status -> 응답 상태 코드
string code -> 응답 봉투의 에러 코드
반환값 : 없음
*/
const respondWithError = (
  method: "post" | "delete",
  status: number,
  code: string,
) => {
  server.use(
    http[method]("*/api/nodes/:nodeId/tags/:tagId", () =>
      HttpResponse.json(
        { isSuccess: false, code, message: "", data: null },
        { status },
      ),
    ),
  );
};

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

  /*
  다른 곳에서 먼저 붙여 서버에 이미 붙어 있다는 거절이다. 반영하지 않으면 편집기를 다시 열 때 이 캐시로 store를 채워 태그가 사라진다.
  */
  it("이미 붙어 있다는 거절(TAG409-2)이면 성공처럼 캐시에 태그를 덧붙인다", async () => {
    respondWithError("post", 409, TAG_ERROR_CODE.DUPLICATE_NODE_TAG);
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.detail("10"), [
      createTreeNode("1", ["2"]),
    ]);
    const { result } = renderHook(() => useAddNodeTagMutation(), { wrapper });

    result.current.mutate({ treeId: "10", nodeId: "1", tagId: "1" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(treeQueryKeys.detail("10"))).toEqual([
      createTreeNode("1", ["2", "1"]),
    ]);
  });

  it("그 밖의 실패에서는 캐시를 그대로 둔다", async () => {
    respondWithError("post", 409, TAG_ERROR_CODE.NODE_TAG_COUNT_EXCEEDED);
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.detail("10"), [
      createTreeNode("1", ["2"]),
    ]);
    const { result } = renderHook(() => useAddNodeTagMutation(), { wrapper });

    result.current.mutate({ treeId: "10", nodeId: "1", tagId: "1" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(treeQueryKeys.detail("10"))).toEqual([
      createTreeNode("1", ["2"]),
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

  /*
  다른 곳에서 먼저 떼어 서버에 연결이 없다는 거절이다. 반영하지 않으면 편집기를 다시 열 때 이 캐시로 store를 채워 뗀 태그가 되살아난다.
  */
  it("연결이 없다는 거절(TAG404-2)이면 성공처럼 캐시에서 태그를 뺀다", async () => {
    respondWithError("delete", 404, TAG_ERROR_CODE.NODE_TAG_NOT_FOUND);
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.detail("10"), [
      createTreeNode("1", ["1", "2"]),
    ]);
    const { result } = renderHook(() => useRemoveNodeTagMutation(), {
      wrapper,
    });

    result.current.mutate({ treeId: "10", nodeId: "1", tagId: "1" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(treeQueryKeys.detail("10"))).toEqual([
      createTreeNode("1", ["2"]),
    ]);
  });

  it("그 밖의 실패에서는 캐시를 그대로 둔다", async () => {
    respondWithError("delete", 500, "COMMON500");
    const { wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.detail("10"), [
      createTreeNode("1", ["1", "2"]),
    ]);
    const { result } = renderHook(() => useRemoveNodeTagMutation(), {
      wrapper,
    });

    result.current.mutate({ treeId: "10", nodeId: "1", tagId: "1" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(treeQueryKeys.detail("10"))).toEqual([
      createTreeNode("1", ["1", "2"]),
    ]);
  });
});
