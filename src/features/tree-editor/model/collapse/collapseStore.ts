import { create } from "zustand";
import { DEFAULT_EXPANDED_DEPTH } from "../../constants/collapse";
import {
  readCollapsedServerIds,
  writeCollapsedServerIds,
} from "../../lib/collapse/collapsedNodesStorage";
import { getCollapsedServerIdsAtDepth } from "../../lib/collapse/getCollapsedServerIdsAtDepth";
import { CustomEditorEdge, CustomEditorNode } from "../types";

type RestoreCollapseParams = {
  treeId: string; // 복원할 트리 ID
  nodes: CustomEditorNode[]; // 초기화로 editor store에 채운 노드 목록
  edges: CustomEditorEdge[]; // 초기화로 editor store에 채운 엣지 목록
};

type ExpandToDepthParams = {
  treeId: string; // 접힘 상태를 바꿀 트리 ID
  nodes: CustomEditorNode[]; // editor store의 전체 노드 목록
  edges: CustomEditorEdge[]; // editor store의 전체 엣지 목록
  expandedDepth: number; // 펼쳐 둘 마지막 깊이. 루트가 깊이 0이다
};

interface CollapseState {
  treeId: string | null; // 접힘 상태가 속한 트리 ID. 복원 전이거나 편집기를 벗어나면 null
  collapsedServerIds: ReadonlySet<string>; // 접힌 노드의 serverId 집합
  savedCollapsedServerIds: ReadonlySet<string> | null; // 임시 접힘을 시작할 때의 접힘 집합. 임시 접힘 중이 아니면 null

  restoreCollapse: (params: RestoreCollapseParams) => void;
  toggleCollapse: (treeId: string, serverId: string) => void;
  expand: (treeId: string, serverId: string) => void;
  expandAll: (treeId: string, serverIds: string[]) => void;
  collapseAll: (treeId: string, serverIds: string[]) => void;
  expandToDepth: (params: ExpandToDepthParams) => void;
  applyExternalCollapse: (serverIds: string[]) => void;
  beginTemporaryCollapse: () => void;
  endTemporaryCollapse: () => void;
  replaceTemporaryCollapse: (serverIds: ReadonlySet<string>) => void;
  resetCollapse: () => void;
}

/*
접힘 상태는 treeStore와 따로 둔다. 접힘 상태는 localStorage와 다른 탭을 따라 바뀌어 편집 상태와 생명주기가 다르다.
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

    if (get().savedCollapsedServerIds === null) {
      writeCollapsedServerIds(treeId, collapsedServerIds);
    }
  };

  return {
    treeId: null,
    collapsedServerIds: new Set(),
    savedCollapsedServerIds: null,

    /*
    초기화로 editor store를 채운 직후 localStorage의 접힘 목록을 읽어 메모리에 채운다.
    저장된 목록이 있으면 그 사이 삭제된 노드의 serverId를 걸러 내고, 걸러 낸 것이 있으면 다시 저장한다.
    저장된 목록이 없으면 기본 접힘 상태를 계산해 바로 저장한다. 처음 들어간 시점의 모양이 다음 방문에도
    유지되어야 하므로, 이후 노드가 늘어도 기본값을 다시 계산하지 않는다.
    */
    restoreCollapse: ({ treeId, nodes, edges }) => {
      set({ savedCollapsedServerIds: null }); // 다른 트리의 임시 접힘이 남아 있으면 저장이 막힌다.

      const savedServerIds = readCollapsedServerIds(treeId);

      if (savedServerIds === null) {
        saveCollapse(
          treeId,
          new Set(
            getCollapsedServerIdsAtDepth(nodes, edges, DEFAULT_EXPANDED_DEPTH),
          ),
        );
        return;
      }

      /*
      노드를 삭제해도 접힘 목록에서는 바로 지우지 않는다(삭제 요청이 실패하면 노드가 같은 serverId로 돌아오므로,
      지워 두면 펼쳐진 채로 돌아온다). 그래서 삭제된 노드의 serverId가 남아 있을 수 있어, 여기서 조회한 트리에 있는 노드만 남긴다.
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
      get().expandAll(treeId, [serverId]);
    },

    /*
    여러 노드를 한 번에 펼친다. 노드마다 expand를 부르면 그때마다 localStorage에 쓰고 다른 탭에 storage 이벤트를 일으키므로,
    한 번만 저장한다.
    */
    expandAll: (treeId, serverIds) => {
      const currentServerIds = getCollapsedServerIdsOf(treeId);
      const collapsedServerIds = new Set(currentServerIds);

      serverIds.forEach((serverId) => collapsedServerIds.delete(serverId));

      if (collapsedServerIds.size === currentServerIds.size) return; // 모두 이미 펼쳐져 있으면 저장할 변화가 없다.

      saveCollapse(treeId, collapsedServerIds);
    },

    /*
    여러 노드를 한 번에 접는다. expandAll과 같은 이유로 한 번만 저장한다.
    */
    collapseAll: (treeId, serverIds) => {
      const currentServerIds = getCollapsedServerIdsOf(treeId);
      const collapsedServerIds = new Set(currentServerIds);

      serverIds.forEach((serverId) => collapsedServerIds.add(serverId));

      if (collapsedServerIds.size === currentServerIds.size) return; // 모두 이미 접혀 있으면 저장할 변화가 없다.

      saveCollapse(treeId, collapsedServerIds);
    },

    /*
    접힘 집합을 정해진 깊이 기준으로 통째로 바꾼다. 노드별로 접어 둔 상태는 남기지 않아, 고른 깊이가 곧 화면의 모양이 된다.
    접힘은 undo 대상이 아니므로 바꾼 뒤에는 이전 상태로 돌아갈 수 없다.
    */
    expandToDepth: ({ treeId, nodes, edges, expandedDepth }) => {
      const currentServerIds = getCollapsedServerIdsOf(treeId);
      const collapsedServerIds = new Set(
        getCollapsedServerIdsAtDepth(nodes, edges, expandedDepth),
      );

      const isUnchanged =
        collapsedServerIds.size === currentServerIds.size &&
        [...collapsedServerIds].every((serverId) =>
          currentServerIds.has(serverId),
        );

      if (isUnchanged) return; // 저장하면 다른 탭에 storage 이벤트만 일으킨다.

      saveCollapse(treeId, collapsedServerIds);
    },

    /*
    다른 탭이 저장한 접힘 목록으로 메모리 집합을 교체한다. 이 탭의 트리에 없는 serverId도 걸러 내지 않는다.
    다른 탭에서 방금 만든 노드일 수 있어, 걸러 낸 채로 이 탭이 다음에 저장하면 그 탭의 접힘을 덮어쓴다.
    받은 값은 이미 localStorage에 있으므로 다시 저장하지 않는다. 다시 쓰면 다른 탭들에 이벤트를 또 일으킨다.
    */
    applyExternalCollapse: (serverIds) => {
      /*
      임시 접힘 중에는 화면을 바꾸지 않고, 끝날 때 돌아갈 집합을 바꾼다. 다른 탭의 변경을 끝날 때 덮어쓰지 않기 위해서다.
      */
      if (get().savedCollapsedServerIds !== null) {
        set({ savedCollapsedServerIds: new Set(serverIds) });
        return;
      }

      set({ collapsedServerIds: new Set(serverIds) });
    },

    /*
    강의처럼 끝나면 사라져야 하는 접힘 변경을 시작한다. 그동안의 변경은 메모리에만 반영하고 localStorage에 쓰지 않으므로,
    강의 중에 탭을 닫아도 사용자의 접힘 상태가 바뀌지 않는다. 사용자가 그동안 직접 접은 것도 함께 되돌아간다.
    첫 트리를 만든 직후에는 초기화를 거치지 않아 treeId가 null일 수 있다. 그래도 임시 상태를 시작해야 강의의 접힘이 저장되지 않는다.
    */
    beginTemporaryCollapse: () => {
      const { collapsedServerIds, savedCollapsedServerIds } = get();

      if (savedCollapsedServerIds !== null) return;

      set({ savedCollapsedServerIds: collapsedServerIds });
    },

    endTemporaryCollapse: () => {
      const { savedCollapsedServerIds } = get();

      if (savedCollapsedServerIds === null) return;

      set({
        collapsedServerIds: savedCollapsedServerIds,
        savedCollapsedServerIds: null,
      });
    },

    /*
    강의를 앞뒤로 옮길 때 그 위치의 접힘으로 바꾼다. 임시 접힘 중이 아니면 사용자의 접힘을 덮어쓰게 되므로 무시한다.
    */
    replaceTemporaryCollapse: (serverIds) => {
      if (get().savedCollapsedServerIds === null) return;

      set({ collapsedServerIds: new Set(serverIds) });
    },

    resetCollapse: () => {
      set({
        treeId: null,
        collapsedServerIds: new Set(),
        savedCollapsedServerIds: null,
      });
    },
  };
});
