import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useLectureStore } from "../lecture/lectureStore";
import { useEditingStore } from "../sync/editingStore";
import { useTreeStore } from "../treeStore";
import { useNodeActions } from "./useNodeActions";

const createNode = (clientId: string, serverId: string | null) =>
  createEditorNode({
    clientId,
    serverId,
    label: clientId,
    orderIndex: 1,
    version: 1,
    x: 0,
    y: 0,
  });

const selectNodes = (...clientIds: string[]) => {
  act(() => {
    useTreeStore.setState((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        selected: clientIds.includes(node.id),
      })),
    }));
  });
};

const renderNodeActions = (isMutating = false) => {
  const handlers = {
    onOpenMemo: vi.fn(),
    onAddChild: vi.fn(),
    onDelete: vi.fn(),
  };
  const { result } = renderHook(() =>
    useNodeActions({ isMutating, ...handlers }),
  );

  return { result, handlers };
};

describe("useNodeActions", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createNode("root", "1"),
        createNode("child", "2"),
        createNode("draft", null),
      ],
      edges: [
        createEditorEdge({ sourceClientId: "root", targetClientId: "child" }),
        createEditorEdge({ sourceClientId: "root", targetClientId: "draft" }),
      ],
    });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useEditingStore.setState({
      nameEditingClientIds: new Set(),
      nameEditRequest: null,
    });
    useLectureStore.setState({ status: "idle" });
  });

  it("하나만 고른 노드를 대상으로 동작에 맞는 handler를 부른다", () => {
    const { result, handlers } = renderNodeActions();
    selectNodes("child");

    expect(result.current.targetClientId).toBe("child");

    act(() => result.current.runNodeAction("openMemo"));
    act(() => result.current.runNodeAction("addChild"));
    act(() => result.current.runNodeAction("delete"));

    expect(handlers.onOpenMemo).toHaveBeenCalledOnce();
    expect(handlers.onAddChild).toHaveBeenCalledOnce();
    expect(handlers.onDelete).toHaveBeenCalledOnce();
  });

  it("이름 편집은 대상 노드에 편집 시작을 요청한다", () => {
    const { result } = renderNodeActions();
    selectNodes("child");

    act(() => result.current.runNodeAction("rename"));

    expect(useEditingStore.getState().nameEditRequest).toEqual({
      clientId: "child",
    });
  });

  /*
  handler까지 가면 handler가 같은 이유로 alert을 띄운다. 이유는 툴팁에 이미 보인다.
  */
  it("막힌 동작은 handler를 부르지 않는다", () => {
    const { result, handlers } = renderNodeActions();
    selectNodes("root");

    expect(result.current.blockReasons.delete).toBe(
      "루트 노드는 삭제할 수 없습니다.",
    );

    act(() => result.current.runNodeAction("delete"));

    expect(handlers.onDelete).not.toHaveBeenCalled();
  });

  it("저장 전 노드와 요청 중의 막힌 이유를 돌려준다", () => {
    const { result } = renderNodeActions(true);
    selectNodes("draft");

    expect(result.current.blockReasons.addChild).toBe(
      "아직 서버에 저장되지 않은 노드입니다.",
    );

    selectNodes("child");

    expect(result.current.blockReasons.addChild).toBe(
      "다른 편집을 저장하는 중입니다.",
    );
  });

  it("노드를 여럿 골랐거나 고르지 않았으면 대상이 없고 아무것도 실행하지 않는다", () => {
    const { result, handlers } = renderNodeActions();

    expect(result.current.targetClientId).toBeNull();

    selectNodes("root", "child");

    expect(result.current.targetClientId).toBeNull();

    act(() => result.current.runNodeAction("openMemo"));

    expect(handlers.onOpenMemo).not.toHaveBeenCalled();
  });

  it("이름을 입력 중인 노드와 강의 중에는 대상이 없다", () => {
    const { result } = renderNodeActions();
    selectNodes("child");

    act(() => useEditingStore.getState().setNodeNameEditing("child", true));

    expect(result.current.targetClientId).toBeNull();

    act(() => useEditingStore.getState().setNodeNameEditing("child", false));
    act(() => useLectureStore.setState({ status: "playing" }));

    expect(result.current.targetClientId).toBeNull();
  });
});
