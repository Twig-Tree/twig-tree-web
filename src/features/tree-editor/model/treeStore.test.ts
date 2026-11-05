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
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
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
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
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
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
  });

  it("applySiblingOrderInStore는 응답이 store와 같으면 상태를 바꾸지 않는다", () => {
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

describe("restoreStructureInStore", () => {
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
  r 밑에 a(1), b(2), d(4)가 있다. 3번 노드가 지워진 뒤라 서버 순번에 빈 번호가 있다.
  */
  beforeEach(() => {
    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [
        createOrderedNode("r", 1),
        createOrderedNode("a", 1),
        createOrderedNode("b", 2),
        createOrderedNode("d", 4),
      ],
      edges: [
        createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
        createEditorEdge({ sourceClientId: "r", targetClientId: "b" }),
        createEditorEdge({ sourceClientId: "r", targetClientId: "d" }),
      ],
    });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
  });

  const getOrder = () =>
    useTreeStore
      .getState()
      .nodes.map((node) => `${node.id}:${node.data.orderIndex}`);

  it("이동을 되돌리면 다시 매기지 않고 보관한 배열 순서와 orderIndex로 돌아간다", () => {
    const { nodes, edges } = useTreeStore.getState();

    useTreeStore
      .getState()
      .moveNodeInStore({ clientId: "d", parentClientId: "r", position: 1 });
    useTreeStore.getState().restoreStructureInStore({ nodes, edges });

    expect(getOrder()).toEqual(["r:1", "a:1", "b:2", "d:4"]);
    expect(useTreeStore.getState().edges).toBe(edges);
  });

  it("그 사이 바뀐 label과 tagIds는 지금 값을 둔다", () => {
    const { nodes, edges } = useTreeStore.getState();
    const { moveNodeInStore, updateNodeLabelInStore, addTagToNodeInStore } =
      useTreeStore.getState();

    moveNodeInStore({ clientId: "d", parentClientId: "r", position: 1 });
    updateNodeLabelInStore("a", "renamed");
    addTagToNodeInStore("d", "t1");
    useTreeStore.getState().restoreStructureInStore({ nodes, edges });

    const nodeById = new Map(
      useTreeStore.getState().nodes.map((node) => [node.id, node]),
    );
    expect(nodeById.get("a")?.data.label).toBe("renamed");
    expect(nodeById.get("d")?.data.tagIds).toEqual(["t1"]);
  });

  it("삭제를 되돌리면 지운 노드와 엣지가 원래 자리로 돌아온다", () => {
    const { nodes, edges } = useTreeStore.getState();

    useTreeStore.getState().deleteNodeFromStore(["b"]);
    useTreeStore.getState().restoreStructureInStore({ nodes, edges });

    expect(getOrder()).toEqual(["r:1", "a:1", "b:2", "d:4"]);
    expect(useTreeStore.getState().edges).toEqual(edges);
  });

  it("추가를 되돌리면 추가한 노드와 엣지만 빠진다", () => {
    const { nodes, edges } = useTreeStore.getState();

    useTreeStore
      .getState()
      .addNodeToStore(
        createOrderedNode("e", 5),
        createEditorEdge({ sourceClientId: "r", targetClientId: "e" }),
      );
    useTreeStore.getState().restoreStructureInStore({ nodes, edges });

    expect(getOrder()).toEqual(["r:1", "a:1", "b:2", "d:4"]);
    expect(useTreeStore.getState().edges).toEqual(edges);
  });
});
