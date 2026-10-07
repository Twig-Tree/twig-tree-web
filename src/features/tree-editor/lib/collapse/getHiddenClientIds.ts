import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getChildClientIdsByParent } from "./getChildClientIdsByParent";

/*
함수 이름 : getHiddenClientIds
기능 : 접힌 노드들의 모든 자손 노드를 모아 화면에서 숨길 노드의 편집기 노드 ID 집합을 만든다. 접힌 노드 자신은 숨기지 않는다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
ReadonlySet<string> collapsedServerIds -> 접힌 노드의 serverId 집합
반환값 : 숨길 노드의 편집기 노드 ID 집합
*/
export const getHiddenClientIds = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  collapsedServerIds: ReadonlySet<string>,
): Set<string> => {
  const hiddenClientIds = new Set<string>();

  if (collapsedServerIds.size === 0) return hiddenClientIds;

  const childClientIdsByParent = getChildClientIdsByParent(edges);

  /*
  접힌 노드의 자식부터 시작해 엣지를 따라 내려가며 자손을 모은다.
  접힘 목록에는 다른 탭에서 만든 노드처럼 이 트리에 없는 serverId가 섞일 수 있는데,
  그런 ID는 어떤 노드와도 맞지 않아 시작점이 되지 않는다.
  */
  const queue = nodes
    .filter(
      (node) =>
        node.data.serverId !== null &&
        collapsedServerIds.has(node.data.serverId),
    )
    .flatMap((node) => childClientIdsByParent.get(node.id) ?? []);

  while (queue.length > 0) {
    const clientId = queue.shift()!;

    /*
    접힌 노드 아래에 또 접힌 노드가 있으면 같은 자손에 두 번 도달한다. 이미 모은 노드는 다시 따라가지 않는다.
    */
    if (hiddenClientIds.has(clientId)) continue;

    hiddenClientIds.add(clientId);
    queue.push(...(childClientIdsByParent.get(clientId) ?? []));
  }

  return hiddenClientIds;
};
