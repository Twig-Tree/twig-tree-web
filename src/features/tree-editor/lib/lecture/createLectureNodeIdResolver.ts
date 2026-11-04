import { type LectureNodeId } from "@/src/entities/lecture";
import { type CustomEditorNode } from "../../model/types";

/*
함수 이름 : createLectureNodeIdResolver
기능 : 서버 노드 ID를 현재 React Flow 세션의 clientId로 바꾸는 함수를 만든다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
반환값 : 서버 노드 ID를 clientId로 바꾸는 함수
*/
export const createLectureNodeIdResolver = (
  nodes: CustomEditorNode[],
): ((nodeId: LectureNodeId) => string | null) => {
  const clientIdByServerId = new Map(
    nodes.flatMap((node) =>
      node.data.serverId === null ? [] : [[node.data.serverId, node.id]],
    ),
  );

  return (nodeId) => clientIdByServerId.get(nodeId) ?? null;
};
