import { describe, it, expect } from "vitest";
import { searchEditorNodes } from "./searchEditorNodes";
import { createEditorNode } from "../add-node/createEditorNode";

const createNode = (index: number, label: string, memo: string | null) => {
  const node = createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label,
    orderIndex: index,
    x: 0,
    y: 0,
  });

  return { ...node, data: { ...node.data, memo } };
};

const nodes = [
  createNode(1, "React 기초", null),
  createNode(2, "상태 관리", "useState와 useReducer 비교"),
  createNode(3, "Hooks", "React 18 이후 변경점"),
  createNode(4, "라우팅", ""),
];

describe("searchEditorNodes", () => {
  it("이름에서만 일치하면 메모 일치로 표시하지 않는다", () => {
    expect(searchEditorNodes(nodes, "라우팅")).toEqual([
      { clientId: "c4", label: "라우팅", isMemoMatched: false },
    ]);
  });

  it("메모에서만 일치하면 메모 일치로 표시한다", () => {
    expect(searchEditorNodes(nodes, "useReducer")).toEqual([
      { clientId: "c2", label: "상태 관리", isMemoMatched: true },
    ]);
  });

  it("이름과 메모에서 모두 일치하면 메모 일치로 표시한다", () => {
    expect(
      searchEditorNodes(
        [createNode(5, "React Hooks", "Hooks 규칙 정리")],
        "hooks",
      ),
    ).toEqual([{ clientId: "c5", label: "React Hooks", isMemoMatched: true }]);
  });

  it("대소문자를 무시한다", () => {
    expect(searchEditorNodes(nodes, "REACT").map((r) => r.clientId)).toEqual([
      "c1",
      "c3",
    ]);
  });

  it("검색어의 앞뒤 공백을 지우고 비교한다", () => {
    expect(searchEditorNodes(nodes, "  라우팅  ")).toEqual([
      { clientId: "c4", label: "라우팅", isMemoMatched: false },
    ]);
  });

  it("검색어가 비었거나 공백뿐이면 빈 배열을 돌려준다", () => {
    expect(searchEditorNodes(nodes, "")).toEqual([]);
    expect(searchEditorNodes(nodes, "   ")).toEqual([]);
  });

  it("메모가 null인 노드는 메모 불일치로 본다", () => {
    expect(searchEditorNodes(nodes, "기초")).toEqual([
      { clientId: "c1", label: "React 기초", isMemoMatched: false },
    ]);
  });

  it("일치하는 노드가 없으면 빈 배열을 돌려준다", () => {
    expect(searchEditorNodes(nodes, "없는 검색어")).toEqual([]);
  });

  it("결과는 노드 배열 순서를 따른다", () => {
    const reversedNodes = [...nodes].reverse();

    expect(
      searchEditorNodes(reversedNodes, "react").map((r) => r.clientId),
    ).toEqual(["c3", "c1"]);
  });
});
