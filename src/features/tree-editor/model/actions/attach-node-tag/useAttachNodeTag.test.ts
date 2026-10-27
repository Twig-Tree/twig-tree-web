import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  MAX_NODE_TAG_COUNT,
  MAX_TAG_NAME_LENGTH,
  tagApi,
  treeQueryKeys,
  type TreeTag,
} from "@/src/entities/tree";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeStore } from "../../treeStore";
import { useAttachNodeTag } from "./useAttachNodeTag";

const NO_TAG_IDS: string[] = []; // 노드가 없을 때의 값. 셀렉터가 매번 새 배열을 돌려주면 store를 읽을 때마다 다시 렌더되어 끝나지 않는다.

const createNode = (tagIds: string[]) => {
  const node = createEditorNode({
    clientId: "c1",
    serverId: "s1",
    label: "node 1",
    orderIndex: 0,
    x: 0,
    y: 0,
  });

  return { ...node, data: { ...node.data, tagIds } };
};

/*
노드의 tagIds를 store에서 읽어 넘겨, 붙인 결과가 다음 호출의 attachedTagIds에 반영되게 한다.
afterEach가 store를 비울 때 hook이 아직 그려져 있으므로, 노드가 없는 경우에도 같은 배열을 돌려준다.
트리 태그 목록 조회가 끝난 뒤에 돌려준다. 조회 중에 태그를 만들면 조회 응답이 만든 태그를 덮는다.
*/
const renderAttachNodeTag = async () => {
  const { wrapper, queryClient } = createQueryWrapper();
  const rendered = renderHook(
    () =>
      useAttachNodeTag({
        clientId: "c1",
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

  it("고른 트리 태그를 노드에 붙인다", async () => {
    const { result } = await renderAttachNodeTag();

    let attachError: string | null = "";
    act(() => {
      attachError = result.current.attachTag("1");
    });

    expect(attachError).toBeNull();
    expect(getNodeTagIds()).toEqual(["1"]);
  });

  it("없는 이름이면 트리 태그를 서버에 만든 뒤 응답의 ID로 붙인다", async () => {
    const createTreeTagSpy = vi.spyOn(tagApi, "createTreeTag");
    const { result, queryClient } = await renderAttachNodeTag();

    let attachError: string | null = "";
    act(() => {
      attachError = result.current.attachTagByName("  중요 ");
    });

    expect(attachError).toBeNull();
    await waitFor(() => expect(getNodeTagIds()).toEqual(["600"]));
    expect(createTreeTagSpy).toHaveBeenCalledExactlyOnceWith(5, {
      name: "중요",
    });
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

  it("트리 태그 생성이 실패하면 알리고 노드에 붙이지 않는다", async () => {
    vi.spyOn(tagApi, "createTreeTag").mockRejectedValueOnce(new Error());
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
    expect(getNodeTagIds()).toEqual([]);
  });
});
