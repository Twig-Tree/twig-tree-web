"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

interface UseFileDropZoneParams {
  isDisabled: boolean; // 첨부를 받을 수 없는 동안 드롭을 무시한다
  onDrop: (files: File[]) => void; // 놓은 파일을 상위로 전달한다
}

/*
파일 탐색기에서 끌어온 경우에만 types에 "Files"가 들어 있다.
페이지 안의 글자나 링크를 끌 때는 드롭 영역이 반응하지 않게 한다.
*/
const hasFiles = (event: DragEvent | globalThis.DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

/*
함수 이름 : useFileDropZone
기능 : 파일을 끌어 영역 위에 올렸는지 추적하고, 놓은 파일을 배열로 전달하는 드래그 이벤트 핸들러를 만든다.
인자 : UseFileDropZoneParams
반환값 : 파일이 영역 위에 있는지 여부와 영역 요소에 붙일 드래그 이벤트 핸들러

dragenter와 dragleave는 영역 안의 자식 요소를 지날 때마다 발생한다. 들어온 횟수를 세어
마지막으로 나갈 때만 강조를 끈다. 그렇지 않으면 입력창과 버튼 위를 지날 때마다 강조가 깜빡인다.

잠겨 있어도 기본 동작은 막는다. 막지 않으면 브라우저가 놓은 파일을 열어 작성 중인 페이지를 벗어난다.
영역 밖도 같은 이유로 이 hook이 붙어 있는 동안 막는다.
*/
export function useFileDropZone({ isDisabled, onDrop }: UseFileDropZoneParams) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const enterCountRef = useRef(0);

  /*
  입력창을 조금 빗나가 놓으면 브라우저가 파일을 열어, 다듬던 지시문이 사라진 채 페이지를 벗어난다.
  파일을 받을 영역이 화면에 있는 동안에만 페이지 전체의 기본 동작을 막는다.

  영역 안에서 일어난 이벤트는 영역의 핸들러가 이미 막아 두었으므로 건너뛴다. 덮어쓰면
  영역 위에서도 커서가 금지 모양으로 바뀐다.
  */
  useEffect(() => {
    const preventFileOpen = (event: globalThis.DragEvent) => {
      if (!hasFiles(event) || event.defaultPrevented) return;

      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    };

    window.addEventListener("dragover", preventFileOpen);
    window.addEventListener("drop", preventFileOpen);

    return () => {
      window.removeEventListener("dragover", preventFileOpen);
      window.removeEventListener("drop", preventFileOpen);
    };
  }, []);

  const resetDragState = () => {
    enterCountRef.current = 0;
    setIsDraggingOver(false);
  };

  const dropZoneProps = {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      enterCountRef.current += 1;
      setIsDraggingOver(true);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!hasFiles(event)) return;

      /*
      dragover를 막아야 drop이 발생한다. 잠긴 동안에는 커서를 금지 모양으로 바꿔
      놓아도 첨부되지 않는다는 것을 미리 보여 준다.
      */
      event.preventDefault();
      event.dataTransfer.dropEffect = isDisabled ? "none" : "copy";
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (!hasFiles(event)) return;

      enterCountRef.current = Math.max(enterCountRef.current - 1, 0);
      if (enterCountRef.current === 0) setIsDraggingOver(false);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      resetDragState();

      if (isDisabled) return;

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) onDrop(files);
    },
  };

  return { dropZoneProps, isDraggingOver };
}
