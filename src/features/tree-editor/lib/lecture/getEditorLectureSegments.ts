import { type LectureSegment } from "@/src/entities/lecture";
import {
  CustomEditorEdge,
  CustomEditorNode,
  EditorLectureSegment,
} from "../../model/types";
import { createLectureNodePathResolver } from "./createLectureNodePathResolver";

/*
함수 이름 : getEditorLectureSegments
기능 : 강의 구간이 이름 경로로 가리키는 노드를 지금 편집기의 노드에 연결한다.
루트부터 엣지를 따라 내려가며 경로의 이름과 같은 자식을 찾는다. 같은 이름의 형제가 여럿이면 노드 배열에서 앞선 노드를 쓴다.
인자 : LectureSegment[] segments -> 연결할 강의 구간
CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 편집기 노드에 연결한 강의 구간. 경로 하나라도 찾지 못하면 null

일부 구간만 재생하지 않는다. 빠진 구간이 있으면 강의 흐름이 끊겨, 이 트리에 맞는 강의가 아니라고 보는 편이 맞다.
*/
export const getEditorLectureSegments = (
  segments: LectureSegment[],
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): EditorLectureSegment[] | null => {
  const findClientId = createLectureNodePathResolver(nodes, edges);

  const editorSegments: EditorLectureSegment[] = [];

  for (const { nodePath, camera, ...segment } of segments) {
    const clientId = findClientId(nodePath);
    const targetClientIds = camera.targetNodePaths.map(findClientId);

    if (clientId === null || targetClientIds.includes(null)) return null;

    editorSegments.push({
      ...segment,
      clientId,
      camera: {
        maxZoom: camera.maxZoom,
        durationMs: camera.durationMs,
        targetClientIds: targetClientIds.filter(
          (targetClientId) => targetClientId !== null,
        ),
      },
    });
  }

  return editorSegments;
};
