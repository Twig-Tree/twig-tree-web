import { create } from "zustand";

interface HighlightState {
  highlightedClientIds: ReadonlySet<string>; // 검색어·태그에 일치해 강조할 노드의 편집기 노드 ID 집합

  setHighlight: (clientIds: string[]) => void;
  clearHighlight: () => void;
}

/*
강조 상태는 treeStore와 따로 둔다. 강조는 서버와 무관한 화면 상태라 undo 대상이 아니고,
treeStore의 set마다 도는 handleSet 비교를 거칠 이유도 없다. React Flow 노드의 className에 써 넣으면
nodes가 history 스냅숏에 들어가므로 쓰지 않는다.
선택과도 다르다. 선택은 메모 패널과 노드 추가·삭제의 기준이 되는 노드 하나이고, 강조는 여러 노드를 표시만 한다.
*/
export const useHighlightStore = create<HighlightState>()((set) => ({
  highlightedClientIds: new Set(),

  setHighlight: (clientIds) => {
    set({ highlightedClientIds: new Set(clientIds) });
  },

  clearHighlight: () => {
    set({ highlightedClientIds: new Set() });
  },
}));
