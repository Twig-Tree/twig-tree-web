import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { readCollapsedServerIds } from "../../lib/collapse/collapsedNodesStorage";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import { type EditorLectureScript } from "../types";
import { useLectureStore } from "./lectureStore";
import { useLectureCollapseRestore } from "./useLectureCollapseRestore";

const script: EditorLectureScript = {
  id: "script",
  title: "강의",
  scenes: [{ id: "scene", clientId: "c1", beats: [] }],
};

/*
c1 ─ c2 ─ c3
*/
const createNode = (index: number) =>
  createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label: `node ${index}`,
    orderIndex: index,
    x: 0,
    y: 0,
  });

const onBeforeRestore = vi.fn();

const getCollapsed = () => [...useCollapseStore.getState().collapsedServerIds];

const renderRestore = () =>
  renderHook(() => useLectureCollapseRestore(onBeforeRestore));

beforeEach(() => {
  onBeforeRestore.mockReset();
  window.localStorage.clear();
  useLectureStore.getState().resetLecture();
  useCollapseStore.getState().resetCollapse();
  useTreeStore.setState({
    treeId: "t1",
    nodes: [1, 2, 3].map(createNode),
    edges: [
      createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
      createEditorEdge({ sourceClientId: "c2", targetClientId: "c3" }),
    ],
  });
  useCollapseStore.getState().collapseAll("t1", ["s2"]);
});

describe("useLectureCollapseRestore", () => {
  it("강의가 끝나면 시작할 때의 접힘으로 돌아가고 화면 맞춤을 맡긴다", () => {
    renderRestore();
    act(() => useLectureStore.getState().startLecture(script));

    act(() => useCollapseStore.getState().expandAll("t1", ["s2"]));
    expect(getCollapsed()).toEqual([]);
    expect(readCollapsedServerIds("t1")).toEqual(["s2"]);

    act(() => useLectureStore.setState({ status: "ended" }));

    expect(getCollapsed()).toEqual(["s2"]);
    expect(onBeforeRestore).toHaveBeenCalledOnce();
  });

  it("일시정지로는 되돌리지 않는다", () => {
    renderRestore();
    act(() => useLectureStore.getState().startLecture(script));
    act(() => useCollapseStore.getState().expandAll("t1", ["s2"]));

    act(() => useLectureStore.getState().pauseLecture());

    expect(getCollapsed()).toEqual([]);
    expect(onBeforeRestore).not.toHaveBeenCalled();
  });

  it("보이는 노드가 그대로면 화면 맞춤을 맡기지 않는다", () => {
    renderRestore();
    act(() => useLectureStore.getState().startLecture(script));

    act(() => useLectureStore.getState().resetLecture());

    expect(getCollapsed()).toEqual(["s2"]);
    expect(onBeforeRestore).not.toHaveBeenCalled();
  });

  it("언마운트하면 되돌린다", () => {
    const { unmount } = renderRestore();

    act(() => useLectureStore.getState().startLecture(script));
    act(() => useCollapseStore.getState().expandAll("t1", ["s2"]));

    unmount();

    expect(getCollapsed()).toEqual(["s2"]);
  });
});
