import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { TAG_ERROR_CODE, tagApi } from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useDetachNodeTag } from "./useDetachNodeTag";

/*
함수 이름 : respondWithError
기능 : 노드 태그 제거 요청에 백엔드 오류 봉투로 응답하도록 MSW 핸들러를 덮는다.
인자 : number status -> 응답 상태 코드
string code -> 응답 봉투의 에러 코드
반환값 : 없음
*/
const respondWithError = (status: number, code: string) => {
  server.use(
    http.delete("*/api/nodes/:nodeId/tags/:tagId", () =>
      HttpResponse.json(
        { isSuccess: false, code, message: "", data: null },
        { status },
      ),
    ),
  );
};

const renderDetachNodeTag = (serverId: string | null = "11") => {
  const { wrapper } = createQueryWrapper();

  return renderHook(
    () => useDetachNodeTag({ treeId: "5", clientId: "c1", serverId }),
    { wrapper },
  );
};

const getNodeTagIds = () => useTreeStore.getState().nodes[0].data.tagIds;

describe("useDetachNodeTag", () => {
  beforeEach(() => {
    const node = createEditorNode({
      clientId: "c1",
      serverId: "11",
      label: "node 1",
      orderIndex: 0,
      x: 0,
      y: 0,
    });

    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [{ ...node, data: { ...node.data, tagIds: ["1", "2"] } }],
      edges: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
  });

  it("노드에서 태그를 떼고 서버에 연결 해제를 요청한다", async () => {
    const removeNodeTagSpy = vi.spyOn(tagApi, "removeNodeTag");
    const { result } = renderDetachNodeTag();

    await act(() => result.current.handleDetachNodeTag("1"));

    expect(removeNodeTagSpy).toHaveBeenCalledExactlyOnceWith(11, 1);
    expect(getNodeTagIds()).toEqual(["2"]);
  });

  it("서버에 저장되기 전인 노드는 요청하지 않고 알린다", async () => {
    const removeNodeTagSpy = vi.spyOn(tagApi, "removeNodeTag");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderDetachNodeTag(null);

    await act(() => result.current.handleDetachNodeTag("1"));

    expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
      "아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.",
    );
    expect(removeNodeTagSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual(["1", "2"]);
  });

  it("요청이 실패하면 뗀 태그를 다시 붙이고 알린다", async () => {
    respondWithError(500, "COMMON500");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderDetachNodeTag();

    await act(() => result.current.handleDetachNodeTag("1"));

    expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
      "태그 제거에 실패했습니다.",
    );
    expect(getNodeTagIds()).toEqual(["2", "1"]);
  });

  it("서버에도 연결이 없다고 거절하면 화면과 같으므로 그대로 둔다", async () => {
    respondWithError(404, TAG_ERROR_CODE.NODE_TAG_NOT_FOUND);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderDetachNodeTag();

    await act(() => result.current.handleDetachNodeTag("1"));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual(["2"]);
  });
});
