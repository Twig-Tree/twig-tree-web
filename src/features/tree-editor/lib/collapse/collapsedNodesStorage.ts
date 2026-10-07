const COLLAPSED_NODES_STORAGE_KEY_PREFIX = "twig-tree:collapsed-nodes:";

/*
함수 이름 : getCollapsedNodesStorageKey
기능 : 트리의 접힘 목록을 저장하는 localStorage 키를 만든다. 다른 탭의 storage 이벤트가 이 트리의 것인지 판별할 때도 같은 키를 쓴다.
인자 : string treeId -> 접힘 목록이 속한 트리 ID
반환값 : localStorage 키
*/
export const getCollapsedNodesStorageKey = (treeId: string): string =>
  `${COLLAPSED_NODES_STORAGE_KEY_PREFIX}${treeId}`;

/*
함수 이름 : parseCollapsedServerIds
기능 : localStorage에 저장된 문자열을 접힌 노드의 serverId 배열로 읽는다. 값이 없거나, JSON이 아니거나, 문자열 배열이 아니면 저장된 접힘 목록이 없는 것으로 본다.
인자 : string | null value -> localStorage에서 읽은 값 또는 storage 이벤트의 newValue
반환값 : 접힌 노드의 serverId 배열. 읽을 수 없으면 null
*/
export const parseCollapsedServerIds = (
  value: string | null,
): string[] | null => {
  if (value === null) return null;

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      !Array.isArray(parsed) ||
      !parsed.every((serverId) => typeof serverId === "string")
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

/*
함수 이름 : readCollapsedServerIds
기능 : 트리의 저장된 접힘 목록을 localStorage에서 읽는다. 시크릿 창이나 사이트 데이터 차단으로 localStorage 접근이 예외를 던져도 저장된 접힘 목록이 없는 것으로 본다.
인자 : string treeId -> 접힘 목록이 속한 트리 ID
반환값 : 접힌 노드의 serverId 배열. 저장된 값이 없거나 읽을 수 없으면 null
*/
export const readCollapsedServerIds = (treeId: string): string[] | null => {
  try {
    return parseCollapsedServerIds(
      window.localStorage.getItem(getCollapsedNodesStorageKey(treeId)),
    );
  } catch {
    return null;
  }
};

/*
함수 이름 : writeCollapsedServerIds
기능 : 트리의 접힘 목록을 localStorage에 저장한다. 접힘은 편의 기능이라 저장에 실패해도 편집을 막지 않도록 예외를 삼킨다.
인자 : string treeId -> 접힘 목록이 속한 트리 ID
Iterable<string> serverIds -> 접힌 노드의 serverId 목록
반환값 : 없음
*/
export const writeCollapsedServerIds = (
  treeId: string,
  serverIds: Iterable<string>,
): void => {
  try {
    window.localStorage.setItem(
      getCollapsedNodesStorageKey(treeId),
      JSON.stringify(Array.from(serverIds)),
    );
  } catch {
    // 저장하지 못하면 다음 방문에 이번 변경이 빠질 뿐, 이번 세션의 화면은 메모리 집합으로 그대로 동작한다.
  }
};
