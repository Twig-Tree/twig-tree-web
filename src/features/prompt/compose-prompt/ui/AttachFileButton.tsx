"use client";

import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { FILE_INPUT_ACCEPT } from "@/src/entities/attachment";
import { IconButton } from "@/src/shared/ui/icon-button";

interface AttachFileButtonProps {
  disabledReason?: string; // 잠겼을 때 알릴 이유. 조건을 아는 상위가 정한다
  isDisabled?: boolean; // 첨부를 더 받을 수 없을 때 버튼을 잠근다
  onSelect: (files: File[]) => void; // 선택한 파일을 상위로 전달한다
}

/*
함수 이름 : AttachFileButton
기능 : 숨겨진 파일 입력을 클릭 버튼과 연결해 파일 선택 창을 열고, 선택한 파일을 배열로 전달한다.
인자 : AttachFileButtonProps
반환값 : 클립 아이콘 첨부 버튼

accept는 파일 선택 창의 편의를 위한 필터일 뿐이므로, 허용 여부 검증은 상위에서 다시 수행한다.
파일 입력에 multiple을 두지 않아 한 번에 하나만 고를 수 있고, 개수 제약은 상위에서 다시 확인한다.

네이티브 disabled 대신 aria-disabled로 잠근다. disabled 버튼은 포커스를 받지 못해
잠긴 이유가 키보드와 스크린 리더에 닿지 않는다. 대신 브라우저가 클릭을 막아 주지 않으므로
onClick에서 직접 막고, 잠긴 모습도 IconButton의 aria-disabled 변형이 담당한다.
*/
export function AttachFileButton({
  disabledReason,
  isDisabled = false,
  onSelect,
}: AttachFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <IconButton
        aria-label="파일 첨부"
        size="sm"
        aria-disabled={isDisabled}
        /*
        잠긴 이유를 알린다. aria-label이 이름을 이미 갖고 있어 title은 설명이 되고,
        마우스에는 호버 툴팁으로, 스크린 리더에는 이름 뒤의 설명으로 전달된다.
        열려 있을 때는 설명할 이유가 없어 붙이지 않는다.

        문구는 상위에서 받는다. 개수 제한과 생성 중은 잠그는 이유가 다른데,
        버튼은 자기가 왜 잠겼는지 모른다.
        */
        title={isDisabled ? disabledReason : undefined}
        onClick={() => {
          if (isDisabled) return;

          inputRef.current?.click();
        }}
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
