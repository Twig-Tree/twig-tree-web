import { describe, expect, it } from "vitest";
import { type LectureScript } from "@/src/entities/lecture";
import { createEditorNode } from "../add-node/createEditorNode";
import { createLectureNodeIdResolver } from "./createLectureNodeIdResolver";
import {
  getEditorLectureAnimation,
  getEditorLectureScript,
} from "./getEditorLectureScript";

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

const script: LectureScript = {
  id: "data-structure",
  title: "자료구조 비교",
  scenes: [
    {
      id: "compare",
      nodeId: "s2",
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
                targetNodeIds: ["s3", "s4"],
                maxZoom: 1.2,
                durationMs: 600,
              },
              {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: ["s3"],
                    style: "pulse",
                    durationMs: 700,
                  },
                  {
                    type: "dim",
                    exceptNodeIds: ["s3", "s4"],
                    durationMs: 700,
                  },
                  {
                    type: "trace",
                    nodeIds: ["s2", "s3"],
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
  it("중첩된 순차·병렬 동작 안의 모든 서버 노드 ID를 clientId로 바꾼다", () => {
    expect(getEditorLectureScript(script, nodes)).toEqual({
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
                        durationMs: 700,
                      },
                      {
                        type: "dim",
                        exceptClientIds: ["c3", "c4"],
                        durationMs: 700,
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

  it("노드 이름이 바뀌어도 서버 노드 ID가 같으면 대본을 연결한다", () => {
    const renamedNodes = nodes.map((node) => ({
      ...node,
      data: { ...node.data, label: `변경-${node.data.label}` },
    }));

    expect(getEditorLectureScript(script, renamedNodes)).not.toBeNull();
  });

  it("애니메이션 안의 서버 노드 ID 하나라도 찾지 못하면 대본 전체를 거부한다", () => {
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
                targetNodeIds: ["missing-node"],
                style: "steady",
                durationMs: 500,
              },
            },
          ],
        },
      ],
    };

    expect(getEditorLectureScript(invalidScript, nodes)).toBeNull();
  });

  it("collapse와 expand의 대상 서버 ID를 clientId로 바꾼다", () => {
    const findClientId = createLectureNodeIdResolver(nodes);

    expect(
      getEditorLectureAnimation(
        { type: "collapse", targetNodeIds: ["s2"], durationMs: 800 },
        findClientId,
      ),
    ).toEqual({ type: "collapse", targetClientIds: ["c2"], durationMs: 800 });
    expect(
      getEditorLectureAnimation(
        { type: "expand", targetNodeIds: ["없는 노드"], durationMs: 800 },
        findClientId,
      ),
    ).toBeNull();
  });

  it("강조와 추적의 연출 옵션을 보존하고 wait는 그대로 넘긴다", () => {
    const findClientId = createLectureNodeIdResolver(nodes);

    expect(
      getEditorLectureAnimation(
        {
          type: "highlight",
          targetNodeIds: ["s2"],
          style: "bounce",
          tone: "success",
          durationMs: 700,
        },
        findClientId,
      ),
    ).toEqual({
      type: "highlight",
      targetClientIds: ["c2"],
      style: "bounce",
      tone: "success",
      durationMs: 700,
    });
    expect(
      getEditorLectureAnimation(
        {
          type: "trace",
          nodeIds: ["s2", "s3"],
          durationMs: 900,
          mode: "progressive",
          direction: "reverse",
          persist: true,
        },
        findClientId,
      ),
    ).toEqual({
      type: "trace",
      clientIds: ["c2", "c3"],
      durationMs: 900,
      mode: "progressive",
      direction: "reverse",
      persist: true,
    });
    expect(
      getEditorLectureAnimation(
        { type: "wait", durationMs: 300 },
        findClientId,
      ),
    ).toEqual({ type: "wait", durationMs: 300 });
  });
});
