"use client";

import { CircleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { useToastStore, type Toast } from "./toastStore";

export const TOAST_DURATION_MS = 4000; // 토스트가 저절로 사라지기까지의 시간

/*
함수 이름 : Toaster
기능 : 띄운 토스트를 화면 아래 가운데에 쌓아 표시한다. 앱에 한 번만 배치한다.
인자 : 없음
반환값 : 토스트 목록 영역

목록 영역은 토스트가 없어도 그려 둔다. 스크린리더는 처음부터 있던 aria-live 영역의 변화만 안정적으로 읽는다.
영역은 클릭을 통과시키고 토스트 자신만 클릭을 받아, 아래 화면을 가리지 않는다.
네이티브 dialog의 모달은 최상위 층에 뜨므로, 모달이 열려 있는 동안의 토스트는 그 아래에 가려진다.
*/
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast; // 표시할 토스트
}

/*
함수 이름 : ToastItem
기능 : 토스트 하나를 표시하고, 정해진 시간이 지나거나 닫기를 누르면 목록에서 지운다.
인자 : ToastItemProps
반환값 : 토스트 한 개

error는 role="alert"로 바로 읽히게 하고, info는 둘러싼 영역의 polite 안내에 맡긴다.
*/
function ToastItem({ toast }: ToastItemProps) {
  const dismissToast = useToastStore((state) => state.dismissToast);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => dismissToast(toast.id),
      TOAST_DURATION_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [dismissToast, toast.id]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card bg-inverse px-4 py-3 text-sm text-on-inverse shadow-overlay"
    >
      {toast.tone === "error" ? (
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => dismissToast(toast.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
