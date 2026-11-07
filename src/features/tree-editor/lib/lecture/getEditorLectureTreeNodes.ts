import {
  getLectureTreeOutline,
  type LectureOutlineNode,
} from "@/src/entities/lecture";
import {
  type CustomEditorEdge,
  type CustomEditorNode,
} from "../../model/types";

/*
함수 이름 : getEditorLectureTreeNodes
기능 : editor store의 노드와 엣지를 강의가 읽는 서버 ID 트리로 옮긴다. 컴파일러 트리와 모델 입력 outline이 같은 노드를 보게 한다.
접힘 상태와 관계없이 store의 모든 노드를 넣어, 같은 트리면 접어 둔 모양이 달라도 같은 결과가 나온다.
서버 ID가 없는 노드는 시나리오가 가리킬 수 없어 뺀다. 그 노드의 자식은 부모가 없으므로 루트가 된다.
형제 순서는 노드 목록 순서를 따른다. 강의의 이름 경로 찾기(createLectureNodePathResolver)와 같은 기준이다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록. source가 부모, target이 자식이다
반환값 : 서버 노드 ID, 부모 서버 ID, 제목 목록
*/
export const getEditorLectureTreeNodes = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): LectureOutlineNode[] => {
  const serverIdByClientId = new Map(
    nodes.map((node) => [node.id, node.data.serverId]),
  );
  const parentClientIdByChild = new Map(
    edges.map((edge) => [edge.target, edge.source]),
  );

  return nodes.flatMap((node) => {
    const { serverId, label } = node.data;
    if (serverId === null) return [];

    const parentClientId = parentClientIdByChild.get(node.id);

    return [
      {
        id: serverId,
        parentId:
          parentClientId === undefined
            ? null
            : (serverIdByClientId.get(parentClientId) ?? null),
        name: label,
      },
    ];
  });
};

/*
함수 이름 : getEditorLectureTreeOutline
기능 : 지금 편집기 트리를 강의 생성 모델에 넘길 outline으로 만든다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 서버 노드 ID로 노드를 가리키는 들여쓴 텍스트
*/
export const getEditorLectureTreeOutline = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): string => getLectureTreeOutline(getEditorLectureTreeNodes(nodes, edges));
