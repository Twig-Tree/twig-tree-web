import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  MAX_NODE_TAG_COUNT,
  MAX_TAG_NAME_LENGTH,
  TAG_ERROR_CODE,
  tagApi,
  treeQueryKeys,
  type TreeTag,
} from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useAttachNodeTag } from "./useAttachNodeTag";

const NO_TAG_IDS: string[] = []; // 노드가 없을 때의 값. 셀렉터가 매번 새 배열을 돌려주면 store를 읽을 때마다 다시 렌더되어 끝나지 않는다.

const createNode = (tagIds: string[]) => {
  const node = createEditorNode({
    clientId: "c1",
    serverId: "11",
    label: "node 1",
    orderIndex: 0,
    x: 0,
    y: 0,
  });

  return { ...node, data: { ...node.data, tagIds } };
};

/*
함수 이름 : respondWithError
기능 : 지정한 POST 요청에 백엔드 오류 봉투로 응답하도록 MSW 핸들러를 덮는다.
인자 : string path -> 덮을 요청 경로
number status -> 응답 상태 코드
string code -> 응답 봉투의 에러 코드
반환값 : 없음
*/
const respondWithError = (path: string, status: number, code: string) => {
  server.use(
    http.post(path, () =>
      HttpResponse.json(
        { isSuccess: false, code, message: "", data: null },
        { status },
      ),
    ),
  );
};

/*
노드의 tagIds를 store에서 읽어 넘겨, 붙인 결과가 다음 호출의 attachedTagIds에 반영되게 한다.
afterEach가 store를 비울 때 hook이 아직 그려져 있으므로, 노드가 없는 경우에도 같은 배열을 돌려준다.
트리 태그 목록(React 1, TypeScript 2) 조회가 끝난 뒤에 돌려준다. 조회 중에 태그를 만들면 조회 응답이 만든 태그를 덮는다.
*/
const renderAttachNodeTag = async (serverId: string | null = "11") => {
  const { wrapper, queryClient } = createQueryWrapper();
  const rendered = renderHook(
    () =>
      useAttachNodeTag({
        treeId: "5",
        clientId: "c1",
        serverId,
        attachedTagIds: useTreeStore(
          (state) =>
            state.nodes.find((node) => node.id === "c1")?.data.tagIds ??
            NO_TAG_IDS,
        ),
      }),
    { wrapper },
  );

  await waitFor(() => expect(queryClient.isFetching()).toBe(0));

  return { ...rendered, queryClient };
};

const getNodeTagIds = () => useTreeStore.getState().nodes[0].data.tagIds;

describe("useAttachNodeTag", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [createNode([])],
      edges: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
  });

  it("고른 트리 태그를 노드에 먼저 붙이고 서버에 연결을 요청한다", async () => {
    const addNodeTagSpy = vi.spyOn(tagApi, "addNodeTag");
    const { result } = await renderAttachNodeTag();

    let attachError: string | null = "";
    act(() => {
      attachError = result.current.attachTag("1");
    });

    expect(attachError).toBeNull();
    expect(getNodeTagIds()).toEqual(["1"]);
    await waitFor(() =>
      expect(addNodeTagSpy).toHaveBeenCalledExactlyOnceWith(11, 1),
    );
  });

  it("없는 이름이면 트리 태그를 서버에 만든 뒤 응답의 ID로 붙인다", async () => {
    const createTreeTagSpy = vi.spyOn(tagApi, "createTreeTag");
    const addNodeTagSpy = vi
      .spyOn(tagApi, "addNodeTag")
      .mockResolvedValue({ id: "600", name: "중요" });
    const { result, queryClient } = await renderAttachNodeTag();

    let attachError: string | null = "";
    act(() => {
      attachError = result.current.attachTagByName("  중요 ");
    });

    expect(attachError).toBeNull();
    await waitFor(() =>
      expect(addNodeTagSpy).toHaveBeenCalledExactlyOnceWith(11, 600),
    );
    expect(createTreeTagSpy).toHaveBeenCalledExactlyOnceWith(5, {
      name: "중요",
    });
    expect(getNodeTagIds()).toEqual(["600"]);
    expect(
      queryClient
        .getQueryData<TreeTag[]>(treeQueryKeys.tags("5"))
        ?.map((tag) => tag.name),
    ).toEqual(["React", "TypeScript", "중요"]);
  });

  it("대소문자만 다른 이름은 새로 만들지 않고 기존 태그를 붙인다", async () => {
    const createTreeTagSpy = vi.spyOn(tagApi, "createTreeTag");
    const { result } = await renderAttachNodeTag();

    act(() => {
      result.current.attachTagByName("react");
    });

    expect(createTreeTagSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual(["1"]);
  });

  it("이미 붙은 태그와 같은 이름이면 안내 문구를 돌려준다", async () => {
    const { result } = await renderAttachNodeTag();

    act(() => {
      result.current.attachTag("1");
    });

    let attachError: string | null = null;
    act(() => {
      attachError = result.current.attachTagByName("React");
    });

    expect(attachError).toBe("이미 붙은 태그입니다.");
    expect(getNodeTagIds()).toEqual(["1"]);
  });

  it("이름이 길이 상한을 넘으면 태그를 만들지 않고 안내 문구를 돌려준다", async () => {
    const createTreeTagSpy = vi.spyOn(tagApi, "createTreeTag");
    const { result } = await renderAttachNodeTag();

    let attachError: string | null = null;
    act(() => {
      attachError = result.current.attachTagByName(
        "가".repeat(MAX_TAG_NAME_LENGTH + 1),
      );
    });

    expect(attachError).toBe("태그 이름은 최대 30자까지 입력할 수 있습니다.");
    expect(createTreeTagSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual([]);
  });

  it("노드당 개수 상한에 닿으면 더 붙이지 않고 트리 태그도 만들지 않는다", async () => {
    const fullTagIds = Array.from(
      { length: MAX_NODE_TAG_COUNT },
      (_, index) => `full-${index}`,
    );
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [createNode(fullTagIds)],
      edges: [],
    });
    const createTreeTagSpy = vi.spyOn(tagApi, "createTreeTag");
    const { result } = await renderAttachNodeTag();

    expect(result.current.remainingTagCount).toBe(0);

    let attachError: string | null = null;
    act(() => {
      attachError = result.current.attachTagByName("하나 더");
    });

    expect(attachError).toBe(result.current.tagLimitMessage);
    expect(createTreeTagSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual(fullTagIds);
  });

  it("서버에 저장되기 전인 노드에는 요청하지 않고 안내 문구를 돌려준다", async () => {
    const createTreeTagSpy = vi.spyOn(tagApi, "createTreeTag");
    const addNodeTagSpy = vi.spyOn(tagApi, "addNodeTag");
    const { result } = await renderAttachNodeTag(null);

    let attachError: string | null = null;
    let attachByNameError: string | null = null;
    act(() => {
      attachError = result.current.attachTag("1");
      attachByNameError = result.current.attachTagByName("중요");
    });

    expect(attachError).toBe(
      "아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.",
    );
    expect(attachByNameError).toBe(attachError);
    expect(createTreeTagSpy).not.toHaveBeenCalled();
    expect(addNodeTagSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual([]);
  });

  it("새 태그를 만드는 동안 다시 입력하면 요청하지 않고 기다리라고 안내한다", async () => {
    const createTreeTagSpy = vi.spyOn(tagApi, "createTreeTag");
    vi.spyOn(tagApi, "addNodeTag").mockResolvedValue({
      id: "600",
      name: "중요",
    });
    const { result } = await renderAttachNodeTag();

    let secondError: string | null = null;
    act(() => {
      result.current.attachTagByName("중요");
      secondError = result.current.attachTagByName("중요");
    });

    expect(secondError).toBe(
      "태그를 만드는 중입니다. 잠시 후 다시 시도해주세요.",
    );
    await waitFor(() => expect(getNodeTagIds()).toEqual(["600"]));
    expect(createTreeTagSpy).toHaveBeenCalledOnce();
  });

  it("다른 곳에서 먼저 만든 이름이면 목록을 다시 받아 그 태그를 붙인다", async () => {
    respondWithError("*/api/trees/:treeId/tags", 409, "TAG409-1");
    vi.spyOn(tagApi, "getTreeTags")
      .mockResolvedValueOnce([{ id: "1", name: "React" }])
      .mockResolvedValueOnce([
        { id: "1", name: "React" },
        { id: "3", name: "Vue" },
      ]);
    const addNodeTagSpy = vi
      .spyOn(tagApi, "addNodeTag")
      .mockResolvedValue({ id: "3", name: "Vue" });
    const { result } = await renderAttachNodeTag();

    act(() => {
      result.current.attachTagByName("Vue");
    });

    await waitFor(() =>
      expect(addNodeTagSpy).toHaveBeenCalledExactlyOnceWith(11, 3),
    );
    expect(getNodeTagIds()).toEqual(["3"]);
  });

  it("트리 태그 생성이 실패하면 알리고 노드에 붙이지 않는다", async () => {
    vi.spyOn(tagApi, "createTreeTag").mockRejectedValueOnce(new Error());
    const addNodeTagSpy = vi.spyOn(tagApi, "addNodeTag");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = await renderAttachNodeTag();

    act(() => {
      result.current.attachTagByName("중요");
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
        "태그 추가에 실패했습니다.",
      ),
    );
    expect(addNodeTagSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual([]);
  });

  it("연결 요청이 실패하면 붙였던 태그를 떼고 알린다", async () => {
    respondWithError("*/api/nodes/:nodeId/tags/:tagId", 500, "COMMON500");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = await renderAttachNodeTag();

    act(() => {
      result.current.attachTag("1");
    });

    expect(getNodeTagIds()).toEqual(["1"]);
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
        "태그 추가에 실패했습니다.",
      ),
    );
    expect(getNodeTagIds()).toEqual([]);
  });

  it("서버에서 노드당 개수 상한을 넘었다고 거절하면 태그를 떼고 상한을 안내한다", async () => {
    respondWithError(
      "*/api/nodes/:nodeId/tags/:tagId",
      409,
      TAG_ERROR_CODE.NODE_TAG_COUNT_EXCEEDED,
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = await renderAttachNodeTag();

    act(() => {
      result.current.attachTag("1");
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
        result.current.tagLimitMessage,
      ),
    );
    expect(getNodeTagIds()).toEqual([]);
  });

  it("서버에 이미 붙어 있다고 거절하면 화면과 같으므로 그대로 둔다", async () => {
    respondWithError(
      "*/api/nodes/:nodeId/tags/:tagId",
      409,
      TAG_ERROR_CODE.DUPLICATE_NODE_TAG,
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result, queryClient } = await renderAttachNodeTag();

    act(() => {
      result.current.attachTag("1");
    });

    /*
    거절을 처리하는 catch가 끝난 뒤에 확인한다. mutation이 오류 상태가 된 뒤 한 번 더 비워 hook의 catch까지 돌린다.
    */
    await waitFor(() =>
      expect(queryClient.getMutationCache().getAll()[0]?.state.status).toBe(
        "error",
      ),
    );
    await act(async () => {});

    expect(alertSpy).not.toHaveBeenCalled();
    expect(getNodeTagIds()).toEqual(["1"]);
  });
});
