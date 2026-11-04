import {
  WORLD_GEOGRAPHY_LECTURE_SCRIPT,
  WORLD_GEOGRAPHY_NODE_IDS,
} from "@/src/entities/lecture";
import { describe, expect, it } from "vitest";
import { createEditorNode } from "../add-node/createEditorNode";
import { getEditorLectureScript } from "./getEditorLectureScript";

const treeRows = [
  ["world", null, "세계", WORLD_GEOGRAPHY_NODE_IDS.world],
  ["europe", "world", "유럽", WORLD_GEOGRAPHY_NODE_IDS.europe],
  ["asia", "world", "아시아", WORLD_GEOGRAPHY_NODE_IDS.asia],
  ["france", "europe", "프랑스", WORLD_GEOGRAPHY_NODE_IDS.france],
  ["germany", "europe", "독일", WORLD_GEOGRAPHY_NODE_IDS.germany],
  ["euro", "europe", "유로", WORLD_GEOGRAPHY_NODE_IDS.euro],
  ["paris", "france", "파리", WORLD_GEOGRAPHY_NODE_IDS.paris],
  ["berlin", "germany", "베를린", WORLD_GEOGRAPHY_NODE_IDS.berlin],
  ["korea", "asia", "대한민국", WORLD_GEOGRAPHY_NODE_IDS.korea],
  ["japan", "asia", "일본", WORLD_GEOGRAPHY_NODE_IDS.japan],
  ["seoul", "korea", "서울", WORLD_GEOGRAPHY_NODE_IDS.seoul],
  ["won", "korea", "원", WORLD_GEOGRAPHY_NODE_IDS.won],
  ["tokyo", "japan", "도쿄", WORLD_GEOGRAPHY_NODE_IDS.tokyo],
  ["yen", "japan", "엔", WORLD_GEOGRAPHY_NODE_IDS.yen],
] as const;

const nodes = treeRows.map(([clientId, , label, serverId], orderIndex) =>
  createEditorNode({
    clientId,
    serverId,
    label,
    orderIndex,
    x: 0,
    y: 0,
  }),
);
describe("WORLD_GEOGRAPHY_LECTURE_SCRIPT", () => {
  it("세계 지리 목 트리의 모든 서버 노드 ID를 편집기 노드에 연결한다", () => {
    const editorScript = getEditorLectureScript(
      WORLD_GEOGRAPHY_LECTURE_SCRIPT,
      nodes,
    );

    expect(editorScript).not.toBeNull();
    expect(editorScript?.scenes).toHaveLength(4);
    expect(editorScript?.scenes.flatMap((scene) => scene.beats)).toHaveLength(
      12,
    );
  });
});
