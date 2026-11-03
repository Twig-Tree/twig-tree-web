import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { useTreeStore } from "./treeStore";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { createEditorEdge } from "../lib/add-node/createEditorEdge";

const createNode = (index: number) =>
  createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label: `node ${index}`,
    orderIndex: index,
    x: 0,
    y: 0,
  });

const getSelectedClientIds = () =>
  useTreeStore
    .getState()
    .nodes.filter((node) => node.selected)
    .map((node) => node.id);

describe("selectOnlyNodeInStore", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [1, 2, 3].map(createNode),
      edges: [
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c3" }),
      ],
    });
    useTreeStore.temporal.getState().clear();
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  it("대상 노드만 선택하고 이전에 선택된 노드의 선택을 푼다", () => {
    const { selectOnlyNodeInStore } = useTreeStore.getState();

    selectOnlyNodeInStore("c2");
    selectOnlyNodeInStore("c3");

    expect(getSelectedClientIds()).toEqual(["c3"]);
  });

  it("선택 상태가 그대로인 노드는 같은 객체를 유지한다", () => {
    const { selectOnlyNodeInStore } = useTreeStore.getState();
    const [firstNode, , thirdNode] = useTreeStore.getState().nodes;

    selectOnlyNodeInStore("c2");

    const [nextFirstNode, , nextThirdNode] = useTreeStore.getState().nodes;
    expect(nextFirstNode).toBe(firstNode);
    expect(nextThirdNode).toBe(thirdNode);
  });

  it("undo history에 기록되지 않는다", () => {
    useTreeStore.getState().selectOnlyNodeInStore("c2");

    expect(useTreeStore.temporal.getState().pastStates).toHaveLength(0);
  });
});

describe("노드 태그 store action", () => {
  const getTagIdsByClientId = () =>
    Object.fromEntries(
      useTreeStore.getState().nodes.map((node) => [node.id, node.data.tagIds]),
    );

  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [1, 2, 3].map(createNode),
      edges: [
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
        createEditorEdge({ sourceClientId: "c1", targetClientId: "c3" }),
      ],
    });
    useTreeStore.temporal.getState().clear();
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  it("addTagToNodeInStore는 대상 노드에만 붙인 순서대로 태그를 더한다", () => {
    const { addTagToNodeInStore } = useTreeStore.getState();

    addTagToNodeInStore("c2", "t1");
    addTagToNodeInStore("c2", "t2");

    expect(getTagIdsByClientId()).toEqual({ c1: [], c2: ["t1", "t2"], c3: [] });
  });

  it("addTagToNodeInStore는 이미 붙은 태그를 다시 더하지 않는다", () => {
    const { addTagToNodeInStore } = useTreeStore.getState();

    addTagToNodeInStore("c2", "t1");
    addTagToNodeInStore("c2", "t1");

    expect(getTagIdsByClientId().c2).toEqual(["t1"]);
  });

  it("removeTagFromNodeInStore는 대상 노드에서만 태그를 뺀다", () => {
    const { addTagToNodeInStore, removeTagFromNodeInStore } =
      useTreeStore.getState();

    addTagToNodeInStore("c2", "t1");
    addTagToNodeInStore("c3", "t1");
    removeTagFromNodeInStore("c2", "t1");

    expect(getTagIdsByClientId()).toEqual({ c1: [], c2: [], c3: ["t1"] });
  });

  it("removeTagFromAllNodesInStore는 모든 노드에서 태그를 빼고, 붙지 않은 노드는 같은 객체를 유지한다", () => {
    const { addTagToNodeInStore, removeTagFromAllNodesInStore } =
      useTreeStore.getState();

    addTagToNodeInStore("c2", "t1");
    addTagToNodeInStore("c3", "t1");
    addTagToNodeInStore("c3", "t2");
    const [firstNode] = useTreeStore.getState().nodes;

    removeTagFromAllNodesInStore("t1");

    expect(getTagIdsByClientId()).toEqual({ c1: [], c2: [], c3: ["t2"] });
    expect(useTreeStore.getState().nodes[0]).toBe(firstNode);
  });

  it("undo history에 기록되지 않는다", () => {
    const {
      addTagToNodeInStore,
      removeTagFromNodeInStore,
      removeTagFromAllNodesInStore,
    } = useTreeStore.getState();

    addTagToNodeInStore("c2", "t1");
    removeTagFromNodeInStore("c2", "t1");
    addTagToNodeInStore("c3", "t2");
    removeTagFromAllNodesInStore("t2");

    expect(useTreeStore.temporal.getState().pastStates).toHaveLength(0);
  });
});

describe("노드 이동 store action", () => {
  const createOrderedNode = (clientId: string, orderIndex: number) =>
    createEditorNode({
      clientId,
      serverId: `s-${clientId}`,
      label: clientId,
      orderIndex,
      x: 0,
      y: 0,
    });

  /*
  r 밑에 a(1), b(2)가 있고 a 밑에 a1(1)이 있다.
  b를 a의 맨 끝으로 옮기면 b는 다시 2번이 되어, 엣지 연결만 바뀌고 orderIndex는 그대로인 이동이 된다.
  */
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createOrderedNode("r", 1),
        createOrderedNode("a", 1),
        createOrderedNode("a1", 1),
        createOrderedNode("b", 2),
      ],
      edges: [
        createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
        createEditorEdge({ sourceClientId: "a", targetClientId: "a1" }),
        createEditorEdge({ sourceClientId: "r", targetClientId: "b" }),
      ],
    });
    useTreeStore.temporal.getState().clear();
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  const getParentClientId = (clientId: string) =>
    useTreeStore.getState().edges.find((edge) => edge.target === clientId)
      ?.source;

  it("같은 부모 안 이동은 history에 기록되어 undo로 되돌릴 수 있다", () => {
    const initialNodes = useTreeStore.getState().nodes;

    useTreeStore
      .getState()
      .moveNodeInStore({ clientId: "b", parentClientId: "r", position: 1 });

    expect(useTreeStore.temporal.getState().pastStates).toHaveLength(1);

    useTreeStore.temporal.getState().undo();

    expect(useTreeStore.getState().nodes).toEqual(initialNodes);
  });

  /*
  조건 3(엣지 연결 변화)이 없으면 기록되지 않아, 실패 복구의 undo()가 그 앞의 편집을 되돌린다.
  */
  it("orderIndex가 그대로인 부모 변경도 history에 기록되어 undo로 되돌릴 수 있다", () => {
    useTreeStore
      .getState()
      .moveNodeInStore({ clientId: "b", parentClientId: "a", position: 2 });

    expect(getParentClientId("b")).toBe("a");
    expect(useTreeStore.temporal.getState().pastStates).toHaveLength(1);

    useTreeStore.temporal.getState().undo();

    expect(getParentClientId("b")).toBe("r");
  });

  it("applySiblingOrderInStore는 응답이 store와 같으면 상태를 바꾸지 않고 history에도 남기지 않는다", () => {
    const { moveNodeInStore, applySiblingOrderInStore } =
      useTreeStore.getState();

    moveNodeInStore({ clientId: "b", parentClientId: "r", position: 1 });
    const movedNodes = useTreeStore.getState().nodes;

    applySiblingOrderInStore([
      [
        {
          id: "s-b",
          parentId: "s-r",
          label: "b",
          orderIndex: 1,
          memo: null,
          tagIds: [],
        },
        {
          id: "s-a",
          parentId: "s-r",
          label: "a",
          orderIndex: 2,
          memo: null,
          tagIds: [],
        },
      ],
    ]);

    expect(useTreeStore.getState().nodes).toBe(movedNodes);
    expect(useTreeStore.temporal.getState().pastStates).toHaveLength(1);
  });
});

describe("onNodesChange", () => {
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [createNode(1)],
      edges: [],
    });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useTreeStore.temporal.getState().clear();
  });

  const getNode = () => useTreeStore.getState().nodes[0];

  it("끄는 중인 위치 변경은 좌표를 반영한다", () => {
    useTreeStore.getState().onNodesChange([
      {
        type: "position",
        id: "c1",
        position: { x: 30, y: 40 },
        dragging: true,
      },
    ]);

    expect(getNode()).toMatchObject({
      position: { x: 30, y: 40 },
      dragging: true,
    });
  });

  /*
  화살표 키 이동과 포인터 드래그의 끝이 이 변경을 낸다. 좌표는 레이아웃과 노드 이동이 정한다.
  */
  it("끌기가 아닌 위치 변경은 좌표를 반영하지 않고 dragging 표시만 푼다", () => {
    const { onNodesChange } = useTreeStore.getState();

    onNodesChange([
      {
        type: "position",
        id: "c1",
        position: { x: 30, y: 40 },
        dragging: true,
      },
    ]);
    onNodesChange([
      {
        type: "position",
        id: "c1",
        position: { x: 50, y: 60 },
        dragging: false,
      },
    ]);

    expect(getNode()).toMatchObject({
      position: { x: 30, y: 40 },
      dragging: false,
    });
  });
});
