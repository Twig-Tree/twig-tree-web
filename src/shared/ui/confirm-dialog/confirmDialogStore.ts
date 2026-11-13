import { create } from "zustand";

export type ConfirmDialogTone = "default" | "danger";

export interface RequestConfirmInput {
  title: string; // 확인 창 제목. 무엇을 할지 묻는 한 문장
  description?: string; // 제목 아래 보조 설명. 되돌릴 수 없음처럼 결정 전에 알아야 할 결과
  confirmLabel: string; // 확인 버튼 문구
  tone?: ConfirmDialogTone; // danger는 확인 버튼을 위험 동작 모양으로 그린다. 생략하면 default
}

export interface ConfirmRequest {
  id: string;
  title: string;
  description: string | undefined;
  confirmLabel: string;
  tone: ConfirmDialogTone;
}

interface ConfirmDialogState {
  request: ConfirmRequest | null; // 지금 열려 있는 확인 요청. 한 번에 하나만 연다
  resolveRequest: ((isConfirmed: boolean) => void) | null; // 열린 요청을 기다리는 쪽에 답을 넘긴다
  requestConfirm: (input: RequestConfirmInput) => Promise<boolean>;
  settleConfirm: (requestId: string, isConfirmed: boolean) => void;
}

/*
확인 창을 화면 어디에서나 띄우고 답을 기다릴 수 있게 store로 둔다.
window.confirm처럼 답을 돌려받는 흐름을 유지해, 호출하는 hook이 창의 열림 상태를 따로 갖지 않게 한다.
*/
export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  request: null,
  resolveRequest: null,

  /*
  함수 이름 : requestConfirm
  기능 : 확인 창을 열고, 사용자가 확인하면 true, 취소하거나 닫으면 false로 끝나는 Promise를 돌려준다.
  인자 : RequestConfirmInput
  반환값 : 사용자의 답을 담은 Promise

  이미 열린 요청이 있으면 그 요청을 false로 끝낸 뒤 새 요청을 연다. 답을 받지 못한 Promise가 남으면
  그 호출부는 영원히 다음 단계로 가지 못한다.
  */
  requestConfirm: ({ title, description, confirmLabel, tone = "default" }) => {
    get().resolveRequest?.(false);

    return new Promise<boolean>((resolve) => {
      set({
        request: {
          id: crypto.randomUUID(),
          title,
          description,
          confirmLabel,
          tone,
        },
        resolveRequest: resolve,
      });
    });
  },

  /*
  함수 이름 : settleConfirm
  기능 : 열린 확인 요청에 답을 넘기고 창을 닫는다. 이미 끝난 요청의 ID면 아무것도 하지 않는다.
  인자 : string requestId -> 답할 확인 요청 ID
  boolean isConfirmed -> 확인했으면 true
  반환값 : 없음

  ID를 확인하는 이유는, 닫히는 창의 늦은 이벤트가 그 사이 새로 열린 요청에 답하지 않게 하기 위해서다.
  */
  settleConfirm: (requestId, isConfirmed) => {
    const { request, resolveRequest } = get();
    if (request?.id !== requestId) return;

    resolveRequest?.(isConfirmed);
    set({ request: null, resolveRequest: null });
  },
}));

/*
함수 이름 : requestConfirm
기능 : React 밖(이벤트 handler, 비동기 흐름)에서도 부를 수 있게 store의 requestConfirm을 꺼내 쓴다.
인자 : RequestConfirmInput
반환값 : 사용자의 답을 담은 Promise
*/
export const requestConfirm = (input: RequestConfirmInput) =>
  useConfirmDialogStore.getState().requestConfirm(input);
