import { create } from "zustand";

export type ToastTone = "info" | "error";

export interface Toast {
  id: string;
  message: string; // 화면에 보여줄 안내 문구
  tone: ToastTone; // error는 스크린리더가 읽던 것을 끊고 바로 알린다
}

export interface ShowToastInput {
  message: string; // 화면에 보여줄 안내 문구
  tone?: ToastTone; // 생략하면 info
}

/*
한 번에 보이는 토스트 개수 상한. 넘으면 가장 오래된 것부터 지운다.
같은 동작을 빠르게 반복해 실패가 쌓여도 화면이 토스트로 덮이지 않게 한다.
*/
export const MAX_TOASTS = 3;

interface ToastState {
  toasts: Toast[];
  showToast: (input: ShowToastInput) => void;
  dismissToast: (toastId: string) => void;
}

/*
토스트 목록을 화면 어디에서나 띄우고 지울 수 있게 store로 둔다.
사라지는 시각은 store가 아니라 Toaster가 정한다. store는 목록만 알게 해 시간 없이 검사할 수 있다.
*/
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  /*
  함수 이름 : showToast
  기능 : 토스트를 목록 끝에 추가하고, 상한을 넘으면 앞에서부터 지운다.
  인자 : ShowToastInput
  반환값 : 없음
  */
  showToast: ({ message, tone = "info" }) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: crypto.randomUUID(), message, tone },
      ].slice(-MAX_TOASTS),
    })),

  /*
  함수 이름 : dismissToast
  기능 : 토스트 하나를 목록에서 지운다. 이미 지워진 ID면 아무것도 하지 않는다.
  인자 : string toastId -> 지울 토스트 ID
  반환값 : 없음
  */
  dismissToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter(({ id }) => id !== toastId),
    })),
}));

/*
함수 이름 : showToast
기능 : React 밖(이벤트 handler, mutation callback)에서도 부를 수 있게 store의 showToast를 꺼내 쓴다.
인자 : ShowToastInput
반환값 : 없음
*/
export const showToast = (input: ShowToastInput) =>
  useToastStore.getState().showToast(input);
