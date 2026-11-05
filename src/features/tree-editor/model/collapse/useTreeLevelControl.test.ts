import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { useCollapseStore } from "./collapseStore";
import { useTreeLevelControl } from "./useTreeLevelControl";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { getHiddenClientIds } from "../../lib/collapse/getHiddenClientIds";

/*
편집기 노드 ID는 c, serverId는 s로 시작한다.

c1
├─ c2
│  └─ c4
│     └─ c5
└─ c3
   └─ c6
*/
const createNode = (index: number) =>
  createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label: `node ${index}`,
    orderIndex: 1,
    x: 0,
    y: 0,
  });

const createEdge = (parentIndex: number, childIndex: number) =>
  createEditorEdge({
    sourceClientId: `c${parentIndex}`,
    targetClientId: `c${childIndex}`,
  });

const treeId = "1";
const nodes = [1, 2, 3, 4, 5, 6].map(createNode);
const edges = [
  createEdge(1, 2),
  createEdge(1, 3),
  createEdge(2, 4),
  createEdge(4, 5),
  createEdge(3, 6),
];

/*
접힘 store를 읽어 보이는 목록을 만드는 일은 useVisibleElements가 맡으므로, 여기서는 같은 계산으로 만들어 넘긴다.
*/
const renderControl = () =>
  renderHook(() => {
    const collapsedServerIds = useCollapseStore(
      (state) => state.collapsedServerIds,
    );
    const hiddenClientIds = getHiddenClientIds(
      nodes,
      edges,
      collapsedServerIds,
    );

    return useTreeLevelControl({
      treeId,
      nodes,
      edges,
      visibleNodes: nodes.filter((node) => !hiddenClientIds.has(node.id)),
      visibleEdges: edges.filter(
        (edge) =>
          !hiddenClientIds.has(edge.source) &&
          !hiddenClientIds.has(edge.target),
      ),
    });
  });

beforeEach(() => {
  useCollapseStore.getState().resetCollapse();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useTreeLevelControl", () => {
  it("모두 펼쳐져 있으면 마지막 계층이고 더 펼칠 수 없다", () => {
    const { result } = renderControl();

    expect(result.current.treeLevel).toBe(4);
    expect(result.current.isExpandLevelDisabled).toBe(true);
    expect(result.current.isCollapseLevelDisabled).toBe(false);
  });

  it("한 단계씩 접고 펼친다", () => {
    const { result } = renderControl();

    act(() => result.current.handleCollapseLevel());
    expect(result.current.treeLevel).toBe(3);

    act(() => result.current.handleCollapseLevel());
    expect(result.current.treeLevel).toBe(2);

    act(() => result.current.handleExpandLevel());
    expect(result.current.treeLevel).toBe(3);
  });

  it("루트만 보이면 더 접을 수 없다", () => {
    const { result } = renderControl();

    act(() => useCollapseStore.getState().toggleCollapse(treeId, "s1"));

    expect(result.current.treeLevel).toBe(1);
    expect(result.current.isCollapseLevelDisabled).toBe(true);
  });

  it("가장 깊은 가지가 보여도 접힌 가지가 있으면 모두 펼칠 수 있다", () => {
    const { result } = renderControl();

    act(() => useCollapseStore.getState().toggleCollapse(treeId, "s3"));

    expect(result.current.treeLevel).toBe(4);
    expect(result.current.isExpandLevelDisabled).toBe(false);

    act(() => result.current.handleExpandLevel());

    expect(useCollapseStore.getState().collapsedServerIds.size).toBe(0);
    expect(result.current.isExpandLevelDisabled).toBe(true);
  });

  it("노드별로 접은 상태에서 접으면 보이는 가장 깊은 곳에서 한 단계 줄인다", () => {
    const { result } = renderControl();

    act(() => useCollapseStore.getState().toggleCollapse(treeId, "s4"));
    expect(result.current.treeLevel).toBe(3);

    act(() => result.current.handleCollapseLevel());

    expect(result.current.treeLevel).toBe(2);
  });

  it("트리가 없으면 계층을 보여 주지 않는다", () => {
    const { result } = renderHook(() =>
      useTreeLevelControl({
        treeId: null,
        nodes: [],
        edges: [],
        visibleNodes: [],
        visibleEdges: [],
      }),
    );

    expect(result.current.treeLevel).toBeNull();
  });
});
