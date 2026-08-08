"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { IconButton } from "../icon-button";

const MAX_HEIGHT_IN_PX = 200; // textarea가 자동으로 늘어날 수 있는 최대 높이

export interface ChatInputProps {
  actions?: ReactNode; // 입력창 하단 왼쪽에 배치할 보조 버튼 영역
  isSubmitDisabled?: boolean; // 전송 버튼을 잠글지 여부
  onChange: (value: string) => void;
  onSubmit: () => void; // 전송 버튼 클릭 또는 Enter 입력 시 실행한다
  placeholder?: string;
  submitLabel?: string; // 전송 버튼의 스크린 리더용 이름
  value: string;
}

/*
함수 이름 : ChatInput
기능 : 프롬프트 입력값을 표시하고 입력 길이에 따라 textarea 높이를 조절하며, Enter 입력과 전송 버튼 클릭을 하나의 전송 동작으로 연결한다.
인자 : ChatInputProps
반환값 : 하단 액션 영역과 전송 버튼을 포함한 채팅 입력 바

입력값을 직접 소유하지 않는 controlled 컴포넌트이며, 첨부 파일이나 모드 토글 같은 도메인 개념도 알지 못한다.
그런 동작은 actions 슬롯에 버튼을 넘겨 상위 feature가 담당한다.
*/
export function ChatInput({
  actions,
  isSubmitDisabled = false,
  onChange,
  onSubmit,
  placeholder,
  submitLabel = "전송",
  value,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /*
  값이 바뀔 때마다 높이를 초기화한 뒤 실제 내용 높이로 다시 계산한다.
  초기화 없이 scrollHeight를 사용하면 글자를 지워도 높이가 줄지 않는다.
  */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT_IN_PX)}px`;
  }, [value]);

  const handleSubmit = () => {
    if (isSubmitDisabled) return;

    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    /*
    한글처럼 조합 중인 글자를 확정하는 Enter는 전송으로 처리하지 않는다.
    */
    if (event.nativeEvent.isComposing) return;

    event.preventDefault();
    handleSubmit();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full resize-none bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">{actions}</div>

        <IconButton
          aria-label={submitLabel}
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          <SendHorizontal />
        </IconButton>
      </div>
    </div>
  );
}
