import { create } from "zustand";
import { type NodePlacement } from "../../lib/move-node/getNodePlacement";
import { CustomEditorEdge, CustomEditorNode } from "../types";

/*
기록은 노드를 clientId로만 가리킨다. clientId는 세션 동안 바뀌지 않으므로, 삭제를 되돌려 노드가
새 serverId로 다시 만들어져도 앞뒤 기록을 고칠 필요가 없다. serverId는 요청을 보낼 때 store에서 읽는다.
*/
export type AddNodeEntry = {
  type: "add";
  clientId: string; // 추가한 노드의 편집기 노드 ID
  parentClientId: string; // 부모의 편집기 노드 ID
  /*
  다시 만들 때 되살릴 값. 추가한 뒤 고친 제목·메모·태그는 기록에 남지 않으므로, undo로 지울 때 그 시점의 값으로 고쳐 쓴다.
  */
  label: string;
  memo: string | null;
  tagIds: string[];
};

export type MoveNodeEntry = {
  type: "move";
  clientId: string; // 옮긴 노드의 편집기 노드 ID
  from: NodePlacement; // 옮기기 전 자리. undo의 목적지
  to: NodePlacement; // 옮긴 뒤 자리. redo의 목적지
};

export type DeleteNodeEntry = {
  type: "delete";
  clientId: string; // 지운 하위 트리 루트의 편집기 노드 ID
  placement: NodePlacement; // 지우기 전 하위 트리 루트의 자리
  nodes: CustomEditorNode[]; // 지운 노드. 메모·태그를 되살리려고 data째 보관한다
  edges: CustomEditorEdge[]; // 지운 엣지. 하위 트리 루트로 들어오던 엣지도 포함한다
};

export type EditHistoryEntry = AddNodeEntry | MoveNodeEntry | DeleteNodeEntry;

interface EditHistoryState {
  past: EditHistoryEntry[]; // undo할 기록. 끝이 가장 최근 편집이다
  future: EditHistoryEntry[]; // redo할 기록. 끝이 다음에 redo할 편집이다

  record: (entry: EditHistoryEntry) => void;
  takeUndo: () => EditHistoryEntry | null;
  takeRedo: () => EditHistoryEntry | null;
  cancelUndo: (entry: EditHistoryEntry) => void;
  cancelRedo: (entry: EditHistoryEntry) => void;
  replaceLatestUndo: (
    entry: EditHistoryEntry,
    nextEntry: EditHistoryEntry,
  ) => void;
  replaceLatestRedo: (
    entry: EditHistoryEntry,
    nextEntry: EditHistoryEntry,
  ) => void;
  clear: () => void;
}

/*
편집 단위 undo/redo 기록. 서버를 모르는 순수 store로, 요청과 화면 반영은 이 기록을 꺼내 쓰는 쪽이 맡는다.
undo/redo도 요청이 실패할 수 있으므로, 기록을 꺼내는 take와 실패 시 되돌려 놓는 cancel을 나눈다.
take는 기록을 반대편 스택으로 바로 옮긴다. 성공하면 따로 부를 것이 없고, 실패하면 cancel로 원래 스택에 돌려놓는다.
*/
export const useEditHistoryStore = create<EditHistoryState>()((set, get) => ({
  past: [],
  future: [],

  /*
  성공한 편집을 기록한다. 새 편집 뒤로는 되돌렸던 편집을 다시 적용할 수 없으므로 redo 기록을 비운다.
  */
  record: (entry) => {
    set((state) => ({ past: [...state.past, entry], future: [] }));
  },

  /*
  함수 이름 : takeUndo
  기능 : 가장 최근 기록을 꺼내 redo 기록으로 옮긴다.
  인자 : 없음
  반환값 : 되돌릴 기록. 기록이 없으면 null
  */
  takeUndo: () => {
    const entry = get().past.at(-1);

    if (!entry) return null;

    set((state) => ({
      past: state.past.slice(0, -1),
      future: [...state.future, entry],
    }));

    return entry;
  },

  /*
  함수 이름 : takeRedo
  기능 : 다음에 다시 적용할 기록을 꺼내 undo 기록으로 옮긴다.
  인자 : 없음
  반환값 : 다시 적용할 기록. 기록이 없으면 null
  */
  takeRedo: () => {
    const entry = get().future.at(-1);

    if (!entry) return null;

    set((state) => ({
      past: [...state.past, entry],
      future: state.future.slice(0, -1),
    }));

    return entry;
  },

  /*
  undo 요청이 실패하면 꺼낸 기록을 undo 기록으로 돌려놓는다. undo가 일어나지 않은 상태가 된다.
  요청 중 기록이 비워졌거나 바뀌었으면 돌려놓을 자리가 없으므로 아무것도 하지 않는다.
  */
  cancelUndo: (entry) => {
    const { future } = get();

    if (future.at(-1) !== entry) return;

    set((state) => ({
      past: [...state.past, entry],
      future: future.slice(0, -1),
    }));
  },

  /*
  redo 요청이 실패하면 꺼낸 기록을 redo 기록으로 돌려놓는다. 확인 기준은 cancelUndo와 같다.
  */
  cancelRedo: (entry) => {
    const { past } = get();

    if (past.at(-1) !== entry) return;

    set((state) => ({
      past: past.slice(0, -1),
      future: [...state.future, entry],
    }));
  },

  /*
  redo가 성공한 뒤 그 기록을 지금 상태로 고쳐 쓴다. 삭제를 되돌린 사이 메모·태그를 고쳤다면, 다시 지울 때의 값으로 기록해야
  다음 undo가 고친 값으로 되살린다. 그 사이 기록이 바뀌었으면 고쳐 쓸 대상이 아니므로 아무것도 하지 않는다.
  */
  replaceLatestUndo: (entry, nextEntry) => {
    const { past } = get();

    if (past.at(-1) !== entry) return;

    set({ past: [...past.slice(0, -1), nextEntry] });
  },

  /*
  undo가 성공한 뒤 그 기록을 지금 상태로 고쳐 쓴다. 추가를 되돌릴 때 그 사이 고친 제목·메모·태그를 남겨 redo가 되살리게 한다.
  확인 기준은 replaceLatestUndo와 같다.
  */
  replaceLatestRedo: (entry, nextEntry) => {
    const { future } = get();

    if (future.at(-1) !== entry) return;

    set({ future: [...future.slice(0, -1), nextEntry] });
  },

  clear: () => {
    set({ past: [], future: [] });
  },
}));
