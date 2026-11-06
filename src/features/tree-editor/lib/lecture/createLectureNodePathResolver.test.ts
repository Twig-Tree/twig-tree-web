import { describe, expect, it } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import { createLectureNodePathResolver } from "./createLectureNodePathResolver";

const createNode = (clientId: string, label: string, orderIndex: number) =>
  createEditorNode({
    clientId,
    serverId: clientId,
    label,
    orderIndex,
    x: 0,
    y: 0,
  });

/*
루트 ─ 자료구조(a) ─ 배열(a1)
     └ 자료구조(b) ─ 스택(b1)
*/
const nodes = [
  createNode("root", "루트", 0),
  createNode("a", "자료구조", 1),
  createNode("a1", "배열", 2),
  createNode("b", "자료구조", 3),
  createNode("b1", "스택", 4),
];
const edges = [
  ["root", "a"],
  ["a", "a1"],
  ["root", "b"],
  ["b", "b1"],
].map(([sourceClientId, targetClientId]) =>
  createEditorEdge({ sourceClientId, targetClientId }),
);

describe("createLectureNodePathResolver", () => {
  const resolve = createLectureNodePathResolver(nodes, edges);

  it("중복된 형제 이름이면 화면 순서로 앞선 노드를 고른다", () => {
    expect(resolve(["루트", "자료구조"])).toBe("a");
  });

  it("앞선 형제에서 경로가 끊기면 다음 형제에서 찾는다", () => {
    expect(resolve(["루트", "자료구조", "스택"])).toBe("b1");
  });

  it("경로가 없으면 null이다", () => {
    expect(resolve(["루트", "자료구조", "큐"])).toBeNull();
    expect(resolve([])).toBeNull();
  });
});
