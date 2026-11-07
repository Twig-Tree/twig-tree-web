import { type LectureNodePath } from "@/src/entities/lecture";
import {
  type CustomEditorEdge,
  type CustomEditorNode,
} from "../../model/types";

/*
함수 이름 : createLectureNodePathResolver
기능 : 현재 편집기 트리에서 루트부터 이름 경로를 따라가 대상 노드의 clientId를 찾는 함수를 만든다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 이름 경로를 clientId로 바꾸는 함수
*/
export const createLectureNodePathResolver = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): ((path: LectureNodePath) => string | null) => {
  const labelByClientId = new Map(
    nodes.map((node) => [node.id, node.data.label]),
  );
  const childClientIds = new Set(edges.map((edge) => edge.target));
  const rootClientIds = nodes
    .filter((node) => !childClientIds.has(node.id))
    .map((node) => node.id);
  const orderByClientId = new Map(nodes.map((node, index) => [node.id, index]));
  const childrenByParent = new Map<string, string[]>();

  for (const edge of edges) {
    const children = childrenByParent.get(edge.source) ?? [];
    children.push(edge.target);
    childrenByParent.set(edge.source, children);
  }

  /*
  reconnect 뒤에는 엣지 배열 순서가 노드 배열과 다를 수 있으므로 중복된 형제 이름은 화면 노드 순서로 결정한다.
  */
  for (const children of childrenByParent.values()) {
    children.sort(
      (a, b) => (orderByClientId.get(a) ?? 0) - (orderByClientId.get(b) ?? 0),
    );
  }

  /*
  형제 이름은 중복될 수 있어, 앞선 후보에서 경로가 끊기면 다음 후보로 돌아가 찾는다.
  */
  const findPath = (
    candidates: string[],
    [label, ...restPath]: LectureNodePath,
  ): string | null => {
    for (const clientId of candidates) {
      if (labelByClientId.get(clientId) !== label) continue;
      if (restPath.length === 0) return clientId;

      const foundClientId = findPath(
        childrenByParent.get(clientId) ?? [],
        restPath,
      );

      if (foundClientId !== null) return foundClientId;
    }

    return null;
  };

  return (path) => (path.length === 0 ? null : findPath(rootClientIds, path));
};
