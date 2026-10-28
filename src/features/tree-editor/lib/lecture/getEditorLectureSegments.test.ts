import { describe, it, expect } from "vitest";
import { DEMO_LECTURE, type LectureSegment } from "@/src/entities/lecture";
import { getEditorLectureSegments } from "./getEditorLectureSegments";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";

const createNode = (clientId: string, label: string) =>
  createEditorNode({
    clientId,
    serverId: clientId.replace("c", "s"),
    label,
    orderIndex: 0,
    x: 0,
    y: 0,
  });

const createEdge = (sourceClientId: string, targetClientId: string) =>
  createEditorEdge({ sourceClientId, targetClientId });

/*
데모 강의(DEMO_LECTURE)가 가리키는 트리와 같은 모양이다.
*/
const nodes = [
  createNode("c1", "컴퓨터 사이언스"),
  createNode("c2", "자료구조"),
  createNode("c3", "알고리즘"),
  createNode("c4", "배열"),
  createNode("c5", "스택"),
  createNode("c6", "정렬"),
];

const edges = [
  createEdge("c1", "c2"),
  createEdge("c1", "c3"),
  createEdge("c2", "c4"),
  createEdge("c2", "c5"),
  createEdge("c3", "c6"),
];

const createSegment = (
  nodePath: string[],
  targetNodePaths: string[][] = [nodePath],
): LectureSegment => ({
  id: nodePath.join("/"),
  nodePath,
  subtitles: [{ startMs: 0, endMs: 1000, text: "문장" }],
  camera: { targetNodePaths, maxZoom: 1, durationMs: 500 },
});

describe("getEditorLectureSegments", () => {
  it("이름 경로를 편집기 노드 ID로 바꾸고 나머지 값은 그대로 싣는다", () => {
    const segment = createSegment(
      ["컴퓨터 사이언스", "자료구조"],
      [
        ["컴퓨터 사이언스", "자료구조"],
        ["컴퓨터 사이언스", "자료구조", "스택"],
      ],
    );

    expect(getEditorLectureSegments([segment], nodes, edges)).toEqual([
      {
        id: "컴퓨터 사이언스/자료구조",
        clientId: "c2",
        subtitles: [{ startMs: 0, endMs: 1000, text: "문장" }],
        camera: { targetClientIds: ["c2", "c5"], maxZoom: 1, durationMs: 500 },
      },
    ]);
  });

  it("데모 강의의 모든 구간을 데모 트리에 연결한다", () => {
    const segments = getEditorLectureSegments(
      DEMO_LECTURE.segments,
      nodes,
      edges,
    );

    expect(segments?.map(({ clientId }) => clientId)).toEqual([
      "c1",
      "c2",
      "c4",
      "c5",
      "c3",
    ]);
  });

  /*
  다른 갈래에 같은 이름이 있어도 경로가 다르면 찾지 않는다. 이름만으로 찾으면 엉뚱한 노드를 설명하게 된다.
  */
  it("이름이 같아도 경로가 다르면 찾지 않는다", () => {
    const segment = createSegment(["컴퓨터 사이언스", "알고리즘", "스택"]);

    expect(getEditorLectureSegments([segment], nodes, edges)).toBeNull();
  });

  it("카메라 대상 경로 하나라도 없으면 null을 돌려준다", () => {
    const segment = createSegment(
      ["컴퓨터 사이언스"],
      [["컴퓨터 사이언스"], ["컴퓨터 사이언스", "운영체제"]],
    );

    expect(getEditorLectureSegments([segment], nodes, edges)).toBeNull();
  });

  it("구간 하나라도 연결하지 못하면 앞 구간까지 버리고 null을 돌려준다", () => {
    const segments = [
      createSegment(["컴퓨터 사이언스"]),
      createSegment(["운영체제"]),
    ];

    expect(getEditorLectureSegments(segments, nodes, edges)).toBeNull();
  });

  it("같은 이름의 형제가 여럿이면 노드 배열에서 앞선 노드를 쓴다", () => {
    const duplicatedNodes = [...nodes, createNode("c7", "배열")];
    const duplicatedEdges = [createEdge("c2", "c7"), ...edges];

    const segments = getEditorLectureSegments(
      [createSegment(["컴퓨터 사이언스", "자료구조", "배열"])],
      duplicatedNodes,
      duplicatedEdges,
    );

    expect(segments?.[0].clientId).toBe("c4");
  });

  it("트리가 비었으면 null을 돌려준다", () => {
    expect(
      getEditorLectureSegments([createSegment(["컴퓨터 사이언스"])], [], []),
    ).toBeNull();
  });
});
