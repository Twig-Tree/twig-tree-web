import { create } from "zustand";

interface ExternalChangeCheckState {
  requestCount: number; // 다른 곳의 변경을 확인해 달라는 요청 횟수. 값이 바뀌면 확인을 시작한다

  requestExternalChangeCheck: () => void;
}

/*
저장 요청이 충돌하거나 노드가 없다는 응답은 다른 곳에서 트리가 바뀌었다는 확실한 신호다. 포커스 이벤트가 없는 나란히 띄운 창에서도 이 신호로 화면을 맞춘다.
신호를 받는 action hook과 확인하는 hook이 떨어져 있어 store로 잇는다.
*/
export const useExternalChangeCheckStore = create<ExternalChangeCheckState>()(
  (set) => ({
    requestCount: 0,

    requestExternalChangeCheck: () => {
      set((state) => ({ requestCount: state.requestCount + 1 }));
    },
  }),
);
