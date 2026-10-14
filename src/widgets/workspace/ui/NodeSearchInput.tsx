import { type ChangeEvent, type KeyboardEvent, useRef } from "react";
import { Search, X } from "lucide-react";
import { IconButton } from "@/src/shared/ui/icon-button";

export interface NodeSearchInputProps {
  value: string; // 입력 중인 검색어
  onChange: (value: string) => void; // 검색어가 바뀔 때
  onClear: () => void; // 지우기 버튼이나 Escape로 검색어를 지울 때
}

/*
함수 이름 : NodeSearchInput
기능 : 노드 검색어 입력창을 그린다. 검색어가 있으면 지우기 버튼을 보여 주고, Escape로도 지운다.
인자 : NodeSearchInputProps
반환값 : 검색어 입력창
*/
export function NodeSearchInput({
  value,
  onChange,
  onClear,
}: NodeSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  /*
  한글 조합 중의 Escape는 조합 취소에 쓰이므로, 조합이 끝난 경우에만 검색어를 지운다.
  */
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape" || event.nativeEvent.isComposing) return;

    event.preventDefault();
    onClear();
  };

  /*
  지우면 지우기 버튼이 사라져 포커스가 갈 곳을 잃는다. 바로 새 검색어를 칠 수 있도록 입력창으로 돌려준다.
  */
  const handleClearClick = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        aria-label="노드 검색"
        placeholder="노드 이름이나 메모 검색"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="h-9 w-full rounded-md border border-slate-200 bg-white pr-9 pl-8 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
      />
      {value !== "" ? (
        <IconButton
          size="sm"
          aria-label="검색어 지우기"
          onClick={handleClearClick}
          className="absolute top-1/2 right-0.5 -translate-y-1/2"
        >
          <X aria-hidden="true" />
        </IconButton>
      ) : null}
    </div>
  );
}
