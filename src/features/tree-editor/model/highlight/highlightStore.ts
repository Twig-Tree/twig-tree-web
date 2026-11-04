import { create } from "zustand";

interface HighlightState {
  highlightedClientIds: ReadonlySet<string>; // 검색어·태그에 일치해 강조할 노드의 편집기 노드 ID 집합

  setHighlight: (clientIds: string[]) => void;
  clearHighlight: () => void;
}

/*
강조 상태는 treeStore와 따로 둔다. 강조는 서버와 무관한 화면 상태라 undo 대상이 아니다. React Flow 노드의
className에 써 넣으면 삭제 기록과 실패 복구용으로 보관하는 노드에 함께 담겨, 되살릴 때 그때의 강조가 돌아오므로 쓰지 않는다.
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
