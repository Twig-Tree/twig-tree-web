import { WORLD_GEOGRAPHY_LECTURE_SCRIPT } from "@/src/entities/lecture";
import { describe, expect, it } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import { getEditorLectureScript } from "./getEditorLectureScript";

const treeRows = [
  ["world", null, "세계"],
  ["europe", "world", "유럽"],
  ["asia", "world", "아시아"],
  ["france", "europe", "프랑스"],
  ["germany", "europe", "독일"],
  ["euro", "europe", "유로"],
  ["paris", "france", "파리"],
  ["berlin", "germany", "베를린"],
  ["korea", "asia", "대한민국"],
  ["japan", "asia", "일본"],
  ["seoul", "korea", "서울"],
  ["won", "korea", "원"],
  ["tokyo", "japan", "도쿄"],
  ["yen", "japan", "엔"],
] as const;

const nodes = treeRows.map(([clientId, , label], orderIndex) =>
  createEditorNode({
    clientId,
    serverId: String(orderIndex + 201),
    label,
    orderIndex,
    x: 0,
    y: 0,
  }),
);
const edges = treeRows.flatMap(([clientId, parentClientId]) =>
  parentClientId === null
    ? []
    : [
        createEditorEdge({
          sourceClientId: parentClientId,
          targetClientId: clientId,
        }),
      ],
);

describe("WORLD_GEOGRAPHY_LECTURE_SCRIPT", () => {
  it("세계 지리 시드 트리의 모든 경로를 편집기 노드에 연결한다", () => {
    const editorScript = getEditorLectureScript(
      WORLD_GEOGRAPHY_LECTURE_SCRIPT,
      nodes,
      edges,
    );

    expect(editorScript).not.toBeNull();
    expect(editorScript?.scenes).toHaveLength(4);
    expect(editorScript?.scenes.flatMap((scene) => scene.beats)).toHaveLength(
      12,
    );
  });
});
