import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { useCollapseStore } from "./collapseStore";
import { useVisibleElements } from "./useVisibleElements";
import { useTreeStore } from "../treeStore";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";

/*
편집기 노드 ID는 c, serverId는 s로 시작한다.

c1
├─ c2
│  └─ c4
└─ c3
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

const nodes = [1, 2, 3, 4].map(createNode);
const edges = [createEdge(1, 2), createEdge(1, 3), createEdge(2, 4)];

/*
페이지처럼 editor store를 구독해 넘긴다. 선택 해제가 store를 바꾸면 hook이 바뀐 노드로 다시 렌더된다.
*/
const renderVisibleElements = (onSelectedNodeHidden: () => void) =>
  renderHook(() =>
    useVisibleElements({
      nodes: useTreeStore((state) => state.nodes),
      edges: useTreeStore((state) => state.edges),
      onSelectedNodeHidden,
    }),
  );

const selectNode = (clientId: string) =>
  useTreeStore.setState((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === clientId ? { ...node, selected: true } : node,
    ),
  }));

const collapse = (serverIds: string[]) =>
  act(() => {
    useCollapseStore.setState({
      treeId: "5",
      collapsedServerIds: new Set(serverIds),
    });
  });

const getSelectedClientIds = () =>
  useTreeStore
    .getState()
    .nodes.filter((node) => node.selected)
    .map((node) => node.id);

beforeEach(() => {
  useTreeStore.getState().initializeTree({ treeId: "5", nodes, edges });
  useCollapseStore.setState({ treeId: "5", collapsedServerIds: new Set() });
});

afterEach(() => {
  useTreeStore.getState().resetTree();
  useCollapseStore.getState().resetCollapse();
});

describe("useVisibleElements", () => {
  it("접힌 노드의 자손과 그 자손에 닿는 엣지를 뺀다", () => {
    const { result } = renderVisibleElements(vi.fn());

    collapse(["s2"]);

    expect(result.current.visibleNodes.map((node) => node.id)).toEqual([
      "c1",
      "c2",
      "c3",
    ]);
    expect(result.current.visibleEdges.map((edge) => edge.target)).toEqual([
      "c2",
      "c3",
    ]);
  });

  it("숨길 노드가 없으면 store의 배열을 그대로 돌려준다", () => {
    const { result } = renderVisibleElements(vi.fn());

    expect(result.current.visibleNodes).toBe(useTreeStore.getState().nodes);
    expect(result.current.visibleEdges).toBe(useTreeStore.getState().edges);
  });

  it("선택된 노드가 숨겨지면 선택을 해제하고 콜백을 부른다", () => {
    selectNode("c4");
    const onSelectedNodeHidden = vi.fn();
    renderVisibleElements(onSelectedNodeHidden);

    collapse(["s2"]);

    expect(getSelectedClientIds()).toEqual([]);
    expect(onSelectedNodeHidden).toHaveBeenCalledTimes(1);
  });

  it("선택된 노드가 보이는 채로 남으면 선택을 유지하고 콜백을 부르지 않는다", () => {
    selectNode("c2");
    const onSelectedNodeHidden = vi.fn();
    renderVisibleElements(onSelectedNodeHidden);

    collapse(["s2"]);

    expect(getSelectedClientIds()).toEqual(["c2"]);
    expect(onSelectedNodeHidden).not.toHaveBeenCalled();
  });
});
