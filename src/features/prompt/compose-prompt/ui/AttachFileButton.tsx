"use client";

import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { FILE_INPUT_ACCEPT } from "@/src/entities/attachment";
import { IconButton } from "@/src/shared/ui/icon-button";

interface AttachFileButtonProps {
  disabled?: boolean; // 첨부 개수 제한에 도달했을 때 버튼을 잠근다
  onSelect: (files: File[]) => void; // 선택한 파일을 상위로 전달한다
}

/*
함수 이름 : AttachFileButton
기능 : 숨겨진 파일 입력을 클릭 버튼과 연결해 파일 선택 창을 열고, 선택한 파일을 배열로 전달한다.
인자 : AttachFileButtonProps
반환값 : 클립 아이콘 첨부 버튼

accept는 파일 선택 창의 편의를 위한 필터일 뿐이므로, 허용 여부 검증은 상위에서 다시 수행한다.
파일 입력에 multiple을 두지 않아 한 번에 하나만 고를 수 있고, 개수 제약은 상위에서 다시 확인한다.
*/
export function AttachFileButton({
  disabled = false,
  onSelect,
}: AttachFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <IconButton
        aria-label="파일 첨부"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip />
      </IconButton>

      <input
        ref={inputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);

          /*
          같은 파일을 연속으로 선택해도 change가 발생하도록 값을 비운다.
          */
          event.target.value = "";

          if (files.length > 0) onSelect(files);
        }}
      />
    </>
  );
}
