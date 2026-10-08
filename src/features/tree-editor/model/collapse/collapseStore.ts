import { create } from "zustand";
import { DEFAULT_EXPANDED_DEPTH } from "../../constants/collapse";
import {
  readCollapsedServerIds,
  writeCollapsedServerIds,
} from "../../lib/collapse/collapsedNodesStorage";
import { getDefaultCollapsedServerIds } from "../../lib/collapse/getDefaultCollapsedServerIds";
import { CustomEditorEdge, CustomEditorNode } from "../types";

type RestoreCollapseParams = {
  treeId: string; // 복원할 트리 ID
  nodes: CustomEditorNode[]; // 초기화로 editor store에 채운 노드 목록
  edges: CustomEditorEdge[]; // 초기화로 editor store에 채운 엣지 목록
};

interface CollapseState {
  treeId: string | null; // 접힘 상태가 속한 트리 ID. 복원 전이거나 편집기를 벗어나면 null
  collapsedServerIds: ReadonlySet<string>; // 접힌 노드의 serverId 집합

  restoreCollapse: (params: RestoreCollapseParams) => void;
  toggleCollapse: (treeId: string, serverId: string) => void;
  expand: (treeId: string, serverId: string) => void;
  applyExternalCollapse: (serverIds: string[]) => void;
  resetCollapse: () => void;
}

/*
접힘 상태는 treeStore와 따로 둔다. treeStore는 zundo로 undo history를 기록하는데, 접기·펼치기는
서버와 무관한 화면 상태라 undo 대상이 아니다. 따로 두면 기록 여부가 treeStore의 handleSet 조건에
기대지 않는다. 또 접힘 상태는 localStorage와 다른 탭을 따라 바뀌어 편집 상태와 생명주기가 다르다.
*/
export const useCollapseStore = create<CollapseState>()((set, get) => {
  /*
  함수 이름 : getCollapsedServerIdsOf
  기능 : 바꿀 기준이 되는 접힘 집합을 고른다. 접힘 store가 다른 트리를 들고 있으면 빈 집합에서 시작한다.
  노드가 없는 워크스페이스에서 루트를 처음 추가하면 초기화를 거치지 않아 복원 없이 이 경로로 들어온다.
  인자 : string treeId -> 바꿀 접힘 상태가 속한 트리 ID
  반환값 : 기준이 되는 접힘 집합
  */
  const getCollapsedServerIdsOf = (treeId: string): ReadonlySet<string> => {
    const state = get();

    return state.treeId === treeId ? state.collapsedServerIds : new Set();
  };

  /*
  함수 이름 : saveCollapse
  기능 : 바뀐 접힘 집합을 메모리와 localStorage에 함께 반영한다.
  인자 : string treeId -> 접힘 상태가 속한 트리 ID
  Set<string> collapsedServerIds -> 바뀐 접힘 집합
  반환값 : 없음
  */
  const saveCollapse = (treeId: string, collapsedServerIds: Set<string>) => {
    set({ treeId, collapsedServerIds });
    writeCollapsedServerIds(treeId, collapsedServerIds);
  };

  return {
    treeId: null,
    collapsedServerIds: new Set(),

    /*
    초기화로 editor store를 채운 직후 localStorage의 접힘 목록을 읽어 메모리에 채운다.
    저장된 목록이 있으면 그 사이 삭제된 노드의 serverId를 걸러 내고, 걸러 낸 것이 있으면 다시 저장한다.
    저장된 목록이 없으면 기본 접힘 상태를 계산해 바로 저장한다. 처음 들어간 시점의 모양이 다음 방문에도
    유지되어야 하므로, 이후 노드가 늘어도 기본값을 다시 계산하지 않는다.
    */
    restoreCollapse: ({ treeId, nodes, edges }) => {
      const savedServerIds = readCollapsedServerIds(treeId);

      if (savedServerIds === null) {
        saveCollapse(
          treeId,
          new Set(
            getDefaultCollapsedServerIds(nodes, edges, DEFAULT_EXPANDED_DEPTH),
          ),
        );
        return;
      }

      /*
      노드를 삭제해도 접힘 목록에서는 바로 지우지 않는다(삭제를 undo하면 접힘 상태도 돌아와야 한다).
      그래서 삭제된 노드의 serverId가 남아 있을 수 있어, 여기서 조회한 트리에 있는 노드만 남긴다.
      */
      const existingServerIds = new Set(
        nodes.flatMap((node) =>
          node.data.serverId === null ? [] : [node.data.serverId],
        ),
      );
      const collapsedServerIds = new Set(
        savedServerIds.filter((serverId) => existingServerIds.has(serverId)),
      );

      if (collapsedServerIds.size < savedServerIds.length) {
        saveCollapse(treeId, collapsedServerIds);
        return;
      }

      set({ treeId, collapsedServerIds });
    },

    toggleCollapse: (treeId, serverId) => {
      const collapsedServerIds = new Set(getCollapsedServerIdsOf(treeId));

      if (collapsedServerIds.has(serverId)) {
        collapsedServerIds.delete(serverId);
      } else {
        collapsedServerIds.add(serverId);
      }

      saveCollapse(treeId, collapsedServerIds);
    },

    expand: (treeId, serverId) => {
      const currentServerIds = getCollapsedServerIdsOf(treeId);

      if (!currentServerIds.has(serverId)) return; // 이미 펼쳐져 있으면 저장할 변화가 없다.

      const collapsedServerIds = new Set(currentServerIds);
      collapsedServerIds.delete(serverId);

      saveCollapse(treeId, collapsedServerIds);
    },

    /*
    다른 탭이 저장한 접힘 목록으로 메모리 집합을 교체한다. 이 탭의 트리에 없는 serverId도 걸러 내지 않는다.
    다른 탭에서 방금 만든 노드일 수 있어, 걸러 낸 채로 이 탭이 다음에 저장하면 그 탭의 접힘을 덮어쓴다.
    받은 값은 이미 localStorage에 있으므로 다시 저장하지 않는다. 다시 쓰면 다른 탭들에 이벤트를 또 일으킨다.
    */
    applyExternalCollapse: (serverIds) => {
      set({ collapsedServerIds: new Set(serverIds) });
    },

    resetCollapse: () => {
      set({ treeId: null, collapsedServerIds: new Set() });
    },
  };
});
