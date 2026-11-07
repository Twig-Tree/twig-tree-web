import { describe, expect, it } from "vitest";
import { createEditorNode } from "../add-node/createEditorNode";
import {
  getEditorLectureTreeNodes,
  getEditorLectureTreeOutline,
} from "./getEditorLectureTreeNodes";

const createNode = (clientId: string, serverId: string | null, label: string) =>
  createEditorNode({
    clientId,
    serverId,
    label,
    orderIndex: 0,
    x: 0,
    y: 0,
  });

const createEdge = (source: string, target: string) => ({
  id: `${source}-${target}`,
  source,
  target,
});

/*
c1(s1) → c2(s2), c4(저장 전) / c2 → c3(s3) / c4 → c5(s5)
*/
const nodes = [
  createNode("c1", "1", "HTTP"),
  createNode("c2", "2", "요청"),
  createNode("c3", "3", "헤더"),
  createNode("c4", null, "저장 전"),
  createNode("c5", "5", "저장 전 노드의 자식"),
];
const edges = [
  createEdge("c1", "c2"),
  createEdge("c2", "c3"),
  createEdge("c1", "c4"),
  createEdge("c4", "c5"),
];

describe("getEditorLectureTreeNodes", () => {
  it("clientId를 서버 ID로 옮기고 저장 전 노드는 뺀다", () => {
    expect(getEditorLectureTreeNodes(nodes, edges)).toEqual([
      { id: "1", parentId: null, name: "HTTP" },
      { id: "2", parentId: "1", name: "요청" },
      { id: "3", parentId: "2", name: "헤더" },
      { id: "5", parentId: null, name: "저장 전 노드의 자식" },
    ]);
  });
});

describe("getEditorLectureTreeOutline", () => {
  it("서버 ID로 노드를 가리키는 outline을 만든다", () => {
    expect(getEditorLectureTreeOutline(nodes, edges)).toBe(
      [
        "- [1] HTTP",
        "  - [2] 요청",
        "    - [3] 헤더",
        "- [5] 저장 전 노드의 자식",
      ].join("\n"),
    );
  });
});
