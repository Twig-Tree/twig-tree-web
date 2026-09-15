import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { isAxiosError } from "axios";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { treeApi } from "../../api/treeApi";
import { useAddNodeMutation } from "./useAddNodeMutation";

describe("useAddNodeMutation", () => {
  /*
  Number(null)이 0이므로 null 확인이 숫자 변환보다 먼저여야 한다.
  순서가 뒤집히면 루트 생성이 parentId=0으로 나가 이 검사가 실패한다.
  */
  it("루트 노드는 parentId를 null로 요청한다", async () => {
    const createNodeSpy = vi.spyOn(treeApi, "createNode");
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useAddNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: "20",
      node: { name: "Root Node", parentId: null, orderId: 1 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createNodeSpy).toHaveBeenCalledWith(20, {
      name: "Root Node",
      parentId: null,
      orderId: 1,
    });
    expect(result.current.data).toEqual({
      id: "500",
      parentId: null,
      label: "Root Node",
      orderIndex: 1,
      memo: null,
    });
  });

  it("자식 노드는 parentId를 숫자로 바꿔 요청한다", async () => {
    const createNodeSpy = vi.spyOn(treeApi, "createNode");
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useAddNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: "20",
      node: { name: "Added node 1", parentId: "500", orderId: 1 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createNodeSpy).toHaveBeenCalledWith(20, {
      name: "Added node 1",
      parentId: 500,
      orderId: 1,
    });
  });

  it("루트가 이미 있는 트리에 루트를 만들면 409 오류가 된다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useAddNodeMutation(), { wrapper });

    result.current.mutate({
      treeId: "10",
      node: { name: "Root Node", parentId: null, orderId: 1 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const { error } = result.current;
    expect(isAxiosError(error) && error.response?.status).toBe(409);
  });
});
