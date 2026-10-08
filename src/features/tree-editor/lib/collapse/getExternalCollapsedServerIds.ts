import {
  getCollapsedNodesStorageKey,
  parseCollapsedServerIds,
} from "./collapsedNodesStorage";

type GetExternalCollapsedServerIdsParams = {
  key: string | null; // storage 이벤트의 key. 다른 탭이 localStorage.clear()를 부르면 null
  newValue: string | null; // storage 이벤트의 newValue. 다른 탭이 키를 지우면 null
  treeId: string | null; // 접힘 store가 들고 있는 트리 ID. 아직 복원 전이면 null
};

/*
함수 이름 : getExternalCollapsedServerIds
기능 : 다른 탭이 일으킨 storage 이벤트에서 지금 열린 트리의 접힘 목록을 꺼낸다. 이 트리의 키가 아니거나, 키가 지워졌거나, 값을 읽을 수 없으면 이벤트를 무시하도록 null을 돌려준다.
인자 : GetExternalCollapsedServerIdsParams
반환값 : 다른 탭이 저장한 접힘 목록. 무시해야 하는 이벤트면 null
*/
export const getExternalCollapsedServerIds = ({
  key,
  newValue,
  treeId,
}: GetExternalCollapsedServerIdsParams): string[] | null => {
  if (key === null || treeId === null) return null;

  if (key !== getCollapsedNodesStorageKey(treeId)) return null;

  return parseCollapsedServerIds(newValue);
};
