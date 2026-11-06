import { DEMO_LECTURES, type LectureScript } from "@/src/entities/lecture";
import {
  type CustomEditorEdge,
  type CustomEditorNode,
} from "../../model/types";
import { createLectureNodePathResolver } from "./createLectureNodePathResolver";

/*
함수 이름 : findDemoLectureScript
기능 : 지금 트리의 노드 이름 구조에 맞는 데모 강의를 찾아 서버 노드 ID로 된 대본을 만든다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 먼저 맞는 데모 강의의 대본. 맞는 강의가 없으면 null

아직 저장되지 않아 서버 ID가 없는 노드는 찾지 못한 것으로 본다. 대본은 서버 ID로만 노드를 가리키기 때문이다.
*/
export const findDemoLectureScript = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): LectureScript | null => {
  const findClientId = createLectureNodePathResolver(nodes, edges);
  const serverIdByClientId = new Map(
    nodes.map((node) => [node.id, node.data.serverId]),
  );

  for (const demoLecture of DEMO_LECTURES) {
    const script = demoLecture.createScript((path) => {
      const clientId = findClientId(path);

      return clientId === null
        ? null
        : (serverIdByClientId.get(clientId) ?? null);
    });

    if (script !== null) return script;
  }

  return null;
};
