import { describe, expect, it } from "vitest";
import { type LectureScript } from "@/src/entities/lecture";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import { getEditorLectureScript } from "./getEditorLectureScript";

const createNode = (clientId: string, label: string) =>
  createEditorNode({
    clientId,
    serverId: clientId.replace("c", "s"),
    label,
    orderIndex: 0,
    x: 0,
    y: 0,
  });

const nodes = [
  createNode("c1", "컴퓨터 사이언스"),
  createNode("c2", "자료구조"),
  createNode("c3", "배열"),
  createNode("c4", "스택"),
];

const edges = [
  createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
  createEditorEdge({ sourceClientId: "c2", targetClientId: "c3" }),
  createEditorEdge({ sourceClientId: "c2", targetClientId: "c4" }),
];

const script: LectureScript = {
  id: "data-structure",
  title: "자료구조 비교",
  scenes: [
    {
      id: "compare",
      nodePath: ["컴퓨터 사이언스", "자료구조"],
      beats: [
        {
          id: "introduce-children",
          narration: {
            text: "자료구조에는 배열과 스택이 있습니다.",
            fallbackDurationMs: 3000,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodePaths: [
                  ["컴퓨터 사이언스", "자료구조", "배열"],
                  ["컴퓨터 사이언스", "자료구조", "스택"],
                ],
                maxZoom: 1.2,
                durationMs: 600,
              },
              {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodePaths: [["컴퓨터 사이언스", "자료구조", "배열"]],
                    style: "pulse",
                  },
                  {
                    type: "dim",
                    exceptNodePaths: [
                      ["컴퓨터 사이언스", "자료구조", "배열"],
                      ["컴퓨터 사이언스", "자료구조", "스택"],
                    ],
                  },
                  {
                    type: "trace",
                    nodePaths: [
                      ["컴퓨터 사이언스", "자료구조"],
                      ["컴퓨터 사이언스", "자료구조", "배열"],
                    ],
                    durationMs: 500,
                  },
                ],
              },
              { type: "reset", scope: "visual" },
            ],
          },
        },
      ],
    },
  ],
};

describe("getEditorLectureScript", () => {
  it("중첩된 순차·병렬 동작 안의 모든 노드 경로를 clientId로 바꾼다", () => {
    expect(getEditorLectureScript(script, nodes, edges)).toEqual({
      id: "data-structure",
      title: "자료구조 비교",
      scenes: [
        {
          id: "compare",
          clientId: "c2",
          beats: [
            {
              id: "introduce-children",
              narration: {
                text: "자료구조에는 배열과 스택이 있습니다.",
                fallbackDurationMs: 3000,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: [
                  {
                    type: "focus",
                    targetClientIds: ["c3", "c4"],
                    maxZoom: 1.2,
                    durationMs: 600,
                  },
                  {
                    type: "group",
                    mode: "parallel",
                    children: [
                      {
                        type: "highlight",
                        targetClientIds: ["c3"],
                        style: "pulse",
                      },
                      {
                        type: "dim",
                        exceptClientIds: ["c3", "c4"],
                      },
                      {
                        type: "trace",
                        clientIds: ["c2", "c3"],
                        durationMs: 500,
                      },
                    ],
                  },
                  { type: "reset", scope: "visual" },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  it("애니메이션 안의 경로 하나라도 찾지 못하면 대본 전체를 거부한다", () => {
    const invalidScript: LectureScript = {
      ...script,
      scenes: [
        {
          ...script.scenes[0],
          beats: [
            {
              ...script.scenes[0].beats[0],
              animation: {
                type: "highlight",
                targetNodePaths: [
                  ["컴퓨터 사이언스", "자료구조", "연결 리스트"],
                ],
                style: "steady",
              },
            },
          ],
        },
      ],
    };

    expect(getEditorLectureScript(invalidScript, nodes, edges)).toBeNull();
  });
});
