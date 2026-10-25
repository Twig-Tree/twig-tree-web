import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { MAX_NODE_TAG_COUNT, MAX_TAG_NAME_LENGTH } from "@/src/entities/tree";
import { createEditorNode } from "../../../lib/add-node/createEditorNode";
import { useTreeTagStore } from "../../tag/treeTagStore";
import { useTreeStore } from "../../treeStore";
import { useAttachNodeTag } from "./useAttachNodeTag";

const NO_TAG_IDS: string[] = []; // 노드가 없을 때의 값. 셀렉터가 매번 새 배열을 돌려주면 store를 읽을 때마다 다시 렌더되어 끝나지 않는다.

/*
노드의 tagIds를 store에서 읽어 넘겨, 붙인 결과가 다음 호출의 attachedTagIds에 반영되게 한다.
afterEach가 store를 비울 때 hook이 아직 그려져 있으므로, 노드가 없는 경우에도 같은 배열을 돌려준다.
*/
const renderAttachNodeTag = () =>
  renderHook(() =>
    useAttachNodeTag({
      clientId: "c1",
      attachedTagIds: useTreeStore(
        (state) =>
          state.nodes.find((node) => node.id === "c1")?.data.tagIds ??
          NO_TAG_IDS,
      ),
    }),
  );

const getNodeTagIds = () => useTreeStore.getState().nodes[0].data.tagIds;
const getTreeTagNames = () =>
  useTreeTagStore.getState().tags.map((tag) => tag.name);

describe("useAttachNodeTag", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createEditorNode({
          clientId: "c1",
          serverId: "s1",
          label: "node 1",
          orderIndex: 0,
          x: 0,
          y: 0,
        }),
      ],
      edges: [],
    });
    useTreeTagStore.getState().addTag({ id: "t1", name: "React" });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useTreeTagStore.getState().resetTags();
  });

  it("고른 트리 태그를 노드에 붙인다", () => {
    const { result } = renderAttachNodeTag();

    let attachError: string | null = "";
    act(() => {
      attachError = result.current.attachTag("t1");
    });

    expect(attachError).toBeNull();
    expect(getNodeTagIds()).toEqual(["t1"]);
  });

  it("없는 이름이면 트리 태그를 새로 만들어 붙인다", () => {
    const { result } = renderAttachNodeTag();

    act(() => {
      result.current.attachTagByName("  중요 ");
    });

    const createdTag = useTreeTagStore.getState().tags[1];
    expect(createdTag.name).toBe("중요");
    expect(getNodeTagIds()).toEqual([createdTag.id]);
  });

  it("대소문자만 다른 이름은 새로 만들지 않고 기존 태그를 붙인다", () => {
    const { result } = renderAttachNodeTag();

    act(() => {
      result.current.attachTagByName("react");
    });

    expect(getTreeTagNames()).toEqual(["React"]);
    expect(getNodeTagIds()).toEqual(["t1"]);
  });

  it("이미 붙은 태그와 같은 이름이면 안내 문구를 돌려준다", () => {
    const { result } = renderAttachNodeTag();

    act(() => {
      result.current.attachTag("t1");
    });

    let attachError: string | null = null;
    act(() => {
      attachError = result.current.attachTagByName("React");
    });

    expect(attachError).toBe("이미 붙은 태그입니다.");
    expect(getNodeTagIds()).toEqual(["t1"]);
  });

  it("이름이 길이 상한을 넘으면 태그를 만들지 않고 안내 문구를 돌려준다", () => {
    const { result } = renderAttachNodeTag();

    let attachError: string | null = null;
    act(() => {
      attachError = result.current.attachTagByName(
        "가".repeat(MAX_TAG_NAME_LENGTH + 1),
      );
    });

    expect(attachError).toBe("태그 이름은 최대 30자까지 입력할 수 있습니다.");
    expect(getTreeTagNames()).toEqual(["React"]);
    expect(getNodeTagIds()).toEqual([]);
  });

  it("노드당 개수 상한에 닿으면 더 붙이지 않고 트리 태그도 만들지 않는다", () => {
    const { result } = renderAttachNodeTag();

    act(() => {
      for (let index = 0; index < MAX_NODE_TAG_COUNT; index += 1) {
        result.current.attachTagByName(`태그 ${index}`);
      }
    });

    expect(result.current.remainingTagCount).toBe(0);

    let attachError: string | null = null;
    act(() => {
      attachError = result.current.attachTagByName("하나 더");
    });

    expect(attachError).toBe(result.current.tagLimitMessage);
    expect(getTreeTagNames()).not.toContain("하나 더");
    expect(getNodeTagIds()).toHaveLength(MAX_NODE_TAG_COUNT);
  });
});
