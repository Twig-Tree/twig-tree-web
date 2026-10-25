import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { TreeTag } from "@/src/entities/tree";
import { findTagByName } from "../lib/tag/findTagByName";
import { getTagSuggestions } from "../lib/tag/getTagSuggestions";
import { validateTagName } from "../lib/tag/validateTagName";

type TagInputProps = {
  tags: TreeTag[]; // 트리 태그 목록. 자동완성 후보가 된다
  attachedTagIds: string[]; // 노드에 이미 붙은 태그 ID 목록. 자동완성에서 뺀다
  remainingTagCount: number; // 더 붙일 수 있는 태그 개수. 0이면 점선 칸을 막는다
  tagLimitMessage: string; // 개수 상한에 닿았을 때 점선 칸 옆에 보여 줄 안내
  onAttachTag: (tagId: string) => string | null; // 자동완성에서 고른 태그를 붙이고, 실패하면 안내 문구를 돌려준다
  onAttachTagByName: (name: string) => string | null; // 입력한 이름으로 태그를 붙이고, 실패하면 안내 문구를 돌려준다
};

/*
함수 이름 : TagInput
기능 : 노드 태그 목록 끝의 점선 칸을 누르면 태그 이름 입력창을 열고, 입력값과 일치하는 트리 태그를 자동완성으로 보여 준다.
목록에서 고르면 태그를 붙이고 입력창을 닫는다. 이름을 확정하면 태그를 붙이고 다음 태그를 받을 수 있게 입력창을 열어 둔다.
blur로는 확정하지 않는다. 실수로 태그가 만들어지지 않도록 Enter와 목록 선택으로만 붙인다.
인자 : TagInputProps
반환값 : 점선 칸 또는 태그 입력창과 자동완성 목록
*/
export const TagInput = ({
  tags,
  attachedTagIds,
  remainingTagCount,
  tagLimitMessage,
  onAttachTag,
  onAttachTagByName,
}: TagInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1); // 키보드로 고르고 있는 자동완성 항목, 없으면 -1
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const isLimitReached = remainingTagCount === 0;
  const suggestions = getTagSuggestions(tags, value, attachedTagIds);
  const trimmedValue = value.trim();

  /*
  입력값이 기존 트리 태그와 이름이 같지 않으면 Enter가 새 태그를 만든다. 확정하기 전에 그 결과를 알 수 있게 안내한다.
  만들 수 없는 이름(길이 초과)에는 안내하지 않는다. Enter를 누르면 만들어지지 않고 오류 문구가 나온다.
  */
  const willCreateTag =
    validateTagName(value) === null &&
    findTagByName(tags, trimmedValue) === undefined;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const closeInput = () => {
    setIsEditing(false);
    setValue("");
    setActiveIndex(-1);
    setErrorMessage(null);
  };

  /*
  자동완성에서 고른 태그를 붙이고 입력창을 닫는다. 열어 두면 빈 입력에 남은 태그 전체가 다시 목록으로 떠서 방금 고른 동작이 끝난 것으로 보이지 않는다.
  */
  const attachSuggestion = (tagId: string) => {
    const attachError = onAttachTag(tagId);

    if (attachError) {
      setErrorMessage(attachError);
      return;
    }

    closeInput();
  };

  /*
  이름으로 붙인 결과에 따라 입력창을 정리한다. 이번 태그로 상한에 닿으면 더 받을 수 없으므로 닫고, 아니면 비운 채 열어 둔다.
  */
  const applyAttachResult = (attachError: string | null) => {
    if (attachError) {
      setErrorMessage(attachError);
      return;
    }

    if (remainingTagCount <= 1) {
      closeInput();
      return;
    }

    setValue("");
    setActiveIndex(-1);
    setErrorMessage(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    setActiveIndex(-1);
    setErrorMessage(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return; // 한글 조합을 끝내는 Enter가 확정으로 한 번 더 처리되지 않게 한다.

    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeInput();
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();

    const activeSuggestion = suggestions[activeIndex];

    if (activeSuggestion) {
      attachSuggestion(activeSuggestion.id);
      return;
    }

    if (trimmedValue === "") return; // 빈 입력은 안내 없이 무시한다.

    applyAttachResult(onAttachTagByName(value));
  };

  /*
  자동완성 목록과 안내 문구가 들어갈 자리를 입력창 아래에 늘 비워 둔다. 태그 영역은 메모 입력칸 아래에 붙어 있어
  열릴 때마다 높이가 늘면 영역 전체가 위로 밀리고 입력창도 따라 움직인다. 목록은 이 자리 위에 겹쳐 그린다.
  점선 칸과 입력창의 높이도 h-7로 맞춰, 입력창을 열 때 줄 높이가 바뀌지 않게 한다.
  */
  if (!isEditing) {
    return (
      <div className="pb-32">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLimitReached}
            onClick={() => setIsEditing(true)}
            className="h-7 rounded-full border border-dashed border-slate-300 px-2.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:border-slate-200"
          >
            + 태그 추가
          </button>

          {isLimitReached ? (
            <p className="text-xs text-slate-400">{tagLimitMessage}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const hasDropdown =
    errorMessage !== null || suggestions.length > 0 || willCreateTag;

  return (
    <div className="pb-32">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="태그 이름"
          aria-expanded={suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            suggestions[activeIndex]
              ? `${listboxId}-${suggestions[activeIndex].id}`
              : undefined
          }
          aria-invalid={errorMessage !== null}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={closeInput}
          placeholder="태그 이름"
          className="h-7 w-full rounded-md border border-slate-200 px-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 aria-[invalid=true]:border-red-400"
        />

        {hasDropdown ? (
          <div className="absolute top-full left-0 z-10 mt-1 w-full">
            {errorMessage ? (
              <p role="alert" className="mb-1 text-xs font-medium text-red-600">
                {errorMessage}
              </p>
            ) : null}

            {suggestions.length > 0 || willCreateTag ? (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                {suggestions.length > 0 ? (
                  <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="태그 자동완성"
                    className="max-h-24 overflow-y-auto py-1"
                  >
                    {suggestions.map((tag, index) => (
                      <li
                        key={tag.id}
                        id={`${listboxId}-${tag.id}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        /*
                        mousedown의 기본 동작은 입력창의 포커스를 빼앗아 blur로 입력창을 닫는다. 막아야 click이 도착한다.
                        */
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => attachSuggestion(tag.id)}
                        className="cursor-pointer truncate px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 aria-selected:bg-slate-100"
                      >
                        {tag.name}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {willCreateTag ? (
                  <p className="truncate border-t border-slate-100 px-3 py-1 text-xs text-slate-500 first:border-t-0">
                    Enter로 &quot;{trimmedValue}&quot; 태그를 새로 만듭니다.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
