import { describe, expect, it } from "vitest";
import { type LectureScenario } from "@/src/entities/lecture";
import { createEditorNode } from "../add-node/createEditorNode";
import {
  compileEditorLectureScenario,
  createEditorLectureCompilerTree,
} from "./compileEditorLectureScenario";

const createNode = (clientId: string, serverId: string | null) =>
  createEditorNode({
    clientId,
    serverId,
    label: clientId,
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
c1(s1) → c2(s2), c3(s3), c4(저장 전) / c2 → c5(s5)
*/
const nodes = [
  createNode("c1", "1"),
  createNode("c2", "2"),
  createNode("c3", "3"),
  createNode("c4", null),
  createNode("c5", "5"),
];
const edges = [
  createEdge("c1", "c2"),
  createEdge("c1", "c3"),
  createEdge("c1", "c4"),
  createEdge("c2", "c5"),
];

const scenario: LectureScenario = {
  scenarioSchemaVersion: 1,
  recipeRegistryVersion: 1,
  title: "편집기 강의",
  scenes: [
    {
      id: "scene-1",
      nodeId: "1",
      beats: [
        {
          id: "beat-1",
          narration: { text: "루트에서 손자 노드까지 내려가 봅시다." },
          cues: [{ intent: "trace", roles: { source: "1", destination: "5" } }],
        },
      ],
    },
  ],
};

describe("createEditorLectureCompilerTree", () => {
  const tree = createEditorLectureCompilerTree(nodes, edges);

  it("서버 ID로 노드와 자식, 경로를 읽는다", () => {
    expect(tree.hasNode("2")).toBe(true);
    expect(tree.getChildIds("1")).toEqual(["2", "3"]);
    expect(tree.getPathNodeIds("1", "5")).toEqual(["1", "2", "5"]);
  });

  it("서버에 저장되지 않은 노드는 넣지 않는다", () => {
    expect(tree.hasNode("c4")).toBe(false);
    expect(tree.getChildIds("1")).not.toContain("c4");
  });
});

describe("compileEditorLectureScenario", () => {
  it("컴파일한 대본의 노드를 편집기 clientId로 옮긴다", () => {
    const result = compileEditorLectureScenario(scenario, {
      scriptId: "editor-lecture",
      nodes,
      edges,
    });

    if (!result.success) throw new Error(JSON.stringify(result.issues));

    expect(result.script.scenes[0].clientId).toBe("c1");
    expect(JSON.stringify(result.script)).toContain(
      '"clientIds":["c1","c2","c5"]',
    );
    expect(result.sourceMap["beat-1"]).toHaveLength(1);
  });

  it("컴파일 문제를 그대로 돌려준다", () => {
    const result = compileEditorLectureScenario(
      {
        ...scenario,
        scenes: [{ ...scenario.scenes[0], nodeId: "99" }],
      },
      { scriptId: "editor-lecture", nodes, edges },
    );

    expect(!result.success && result.issues.map(({ path }) => path)).toEqual([
      ["scenes", 0, "nodeId"],
    ]);
  });
});
