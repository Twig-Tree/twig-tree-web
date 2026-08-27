"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  children: ReactNode; // 모달이 열려 있는 동안에만 렌더링할 내용
  isOpen: boolean; // 모달 표시 여부
  onClose: () => void; // Escape 입력과 바깥 클릭으로 닫기를 요청했을 때 실행할 callback
  title: string; // 보조 기술이 읽을 모달 이름
  widthClassName?: string; // 패널 최대 너비. 생략하면 기본값을 사용한다
}

/*
함수 이름 : Modal
기능 : 네이티브 dialog의 모달 동작을 사용해 화면 가운데에 패널을 띄우고, Escape 입력과 바깥 클릭을 닫기 요청으로 전달한다.
인자 : ModalProps
반환값 : 열려 있는 동안 children을 표시하는 모달 패널

포커스 이동, 배경 요소 비활성화, 최상단 표시는 showModal이 브라우저에서 처리한다.
접근 이름은 aria-label로 지정하므로, 화면에 보이는 제목은 children에서 자유롭게 구성한다.
*/
export function Modal({
  children,
  isOpen,
  onClose,
  title,
  widthClassName = "max-w-md",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  /*
  open 속성을 직접 렌더링하면 모달이 아닌 일반 dialog로 열리므로,
  isOpen을 showModal과 close 호출로 옮겨 dialog의 열림 상태와 맞춘다.
  */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      /*
      Escape의 기본 동작은 dialog를 바로 닫는다. 그대로 두면 isOpen이 true로 남아
      열림 상태가 어긋나므로, 닫기 요청만 전달하고 실제 닫기는 isOpen 변화에 맡긴다.
      */
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      /*
      패널은 children이 채우므로, dialog 자신이 대상인 클릭은 바깥 영역 클릭이다.
      */
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-xl border border-slate-100 bg-white p-0 shadow-xl backdrop:bg-slate-900/45 ${widthClassName}`}
    >
      {isOpen ? children : null}
    </dialog>
  );
}
