import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { useCollapseStore } from "./collapseStore";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import {
  getCollapsedNodesStorageKey,
  readCollapsedServerIds,
} from "../../lib/collapse/collapsedNodesStorage";

/*
편집기 노드 ID는 c, serverId는 s로 시작한다.

c1
└─ c2
   └─ c3   깊이 2, 자식 있음 → 기본값에서 접힌다
      └─ c4
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
const edges = [createEdge(1, 2), createEdge(2, 3), createEdge(3, 4)];

const saveToStorage = (treeId: string, serverIds: string[]) =>
  window.localStorage.setItem(
    getCollapsedNodesStorageKey(treeId),
    JSON.stringify(serverIds),
  );

const getCollapsedServerIds = () =>
  Array.from(useCollapseStore.getState().collapsedServerIds);

beforeEach(() => {
  useCollapseStore.getState().resetCollapse();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("restoreCollapse", () => {
  it("저장된 접힘 목록이 없으면 기본 접힘 상태를 계산해 바로 저장한다", () => {
    useCollapseStore.getState().restoreCollapse({ treeId: "5", nodes, edges });

    expect(useCollapseStore.getState().treeId).toBe("5");
    expect(getCollapsedServerIds()).toEqual(["s3"]);
    expect(readCollapsedServerIds("5")).toEqual(["s3"]);
  });

  it("저장된 접힘 목록이 있으면 기본값을 계산하지 않고 그대로 쓴다", () => {
    saveToStorage("5", ["s1"]);

    useCollapseStore.getState().restoreCollapse({ treeId: "5", nodes, edges });

    expect(getCollapsedServerIds()).toEqual(["s1"]);
  });

  it("모두 펼쳐 저장된 빈 목록은 기본값으로 다시 접지 않는다", () => {
    saveToStorage("5", []);

    useCollapseStore.getState().restoreCollapse({ treeId: "5", nodes, edges });

    expect(getCollapsedServerIds()).toEqual([]);
    expect(readCollapsedServerIds("5")).toEqual([]);
  });

  it("저장된 목록에서 트리에 없는 serverId를 걸러 내고 걸러 낸 목록을 다시 저장한다", () => {
    saveToStorage("5", ["s2", "s99"]);

    useCollapseStore.getState().restoreCollapse({ treeId: "5", nodes, edges });

    expect(getCollapsedServerIds()).toEqual(["s2"]);
    expect(readCollapsedServerIds("5")).toEqual(["s2"]);
  });
});

describe("toggleCollapse", () => {
  beforeEach(() => {
    saveToStorage("5", []);
    useCollapseStore.getState().restoreCollapse({ treeId: "5", nodes, edges });
  });

  it("펼친 노드는 접고, 접힌 노드는 펼치며 매번 저장한다", () => {
    useCollapseStore.getState().toggleCollapse("5", "s2");

    expect(getCollapsedServerIds()).toEqual(["s2"]);
    expect(readCollapsedServerIds("5")).toEqual(["s2"]);

    useCollapseStore.getState().toggleCollapse("5", "s2");

    expect(getCollapsedServerIds()).toEqual([]);
    expect(readCollapsedServerIds("5")).toEqual([]);
  });

  it("접힘 store가 다른 트리를 들고 있으면 빈 집합에서 시작한다", () => {
    useCollapseStore.getState().toggleCollapse("5", "s2");

    useCollapseStore.getState().toggleCollapse("6", "s10");

    expect(useCollapseStore.getState().treeId).toBe("6");
    expect(getCollapsedServerIds()).toEqual(["s10"]);
    expect(readCollapsedServerIds("6")).toEqual(["s10"]);
    expect(readCollapsedServerIds("5")).toEqual(["s2"]);
  });
});

describe("expand", () => {
  beforeEach(() => {
    saveToStorage("5", ["s2"]);
    useCollapseStore.getState().restoreCollapse({ treeId: "5", nodes, edges });
  });

  it("접힌 노드를 펼치고 저장한다", () => {
    useCollapseStore.getState().expand("5", "s2");

    expect(getCollapsedServerIds()).toEqual([]);
    expect(readCollapsedServerIds("5")).toEqual([]);
  });

  it("이미 펼쳐진 노드면 접힘 집합을 바꾸지 않는다", () => {
    const before = useCollapseStore.getState().collapsedServerIds;

    useCollapseStore.getState().expand("5", "s1");

    expect(useCollapseStore.getState().collapsedServerIds).toBe(before);
  });
});

describe("applyExternalCollapse", () => {
  it("이 탭의 트리에 없는 serverId도 걸러 내지 않고, 다시 저장하지 않는다", () => {
    saveToStorage("5", ["s2"]);
    useCollapseStore.getState().restoreCollapse({ treeId: "5", nodes, edges });

    useCollapseStore.getState().applyExternalCollapse(["s2", "s20"]);

    expect(getCollapsedServerIds()).toEqual(["s2", "s20"]);
    expect(readCollapsedServerIds("5")).toEqual(["s2"]);
  });
});
