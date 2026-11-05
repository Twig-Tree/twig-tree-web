import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TreeTag } from "@/src/entities/tree";

export interface WorkspaceTagListProps {
  tags: TreeTag[]; // 트리 전체 태그
  selectedTagId: string | null; // 결과 목록에 보이는 태그, 고르지 않았으면 null
  onSelectTag: (tagId: string) => void; // 태그를 눌렀을 때. 같은 태그를 다시 누르면 선택을 푸는 것은 패널이 정한다
  onDeleteTag: (tagId: string) => void; // 칩의 X 버튼을 눌렀을 때. 확인과 삭제는 호출부가 맡는다
}

/*
함수 이름 : WorkspaceTagList
기능 : 워크스페이스 패널 하단에 트리 전체 태그를 노드 태그와 같은 칩으로, 접고 펼 수 있게 보여 준다. 태그를 누르면 그 태그를 넘기고,
고른 태그는 캔버스 강조와 같은 amber 색으로 표시한다. 칩의 X 버튼으로 트리 태그를 지운다.
펼친 상태는 저장하지 않는 화면 상태라 컴포넌트 안에만 둔다.
인자 : WorkspaceTagListProps
반환값 : 트리 태그 드롭다운
*/
export function WorkspaceTagList({
  tags,
  selectedTagId,
  onSelectTag,
  onDeleteTag,
}: WorkspaceTagListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const listId = useId();

  return (
    <section
      aria-label="트리 태그"
      className="flex max-h-[40%] min-h-0 shrink-0 flex-col border-t border-line"
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={listId}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="flex shrink-0 items-center justify-between px-panel py-3 text-xs font-medium text-content-muted hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none focus-visible:ring-inset"
      >
        <span>태그 {tags.length}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${isExpanded ? "" : "rotate-180"}`}
        />
      </button>

      {isExpanded ? (
        /*
        스크롤 영역은 바깥으로 그려지는 ring을 잘라 내므로, 첫 줄 칩의 선택 테두리가 보이도록 위쪽 여백을 둔다.
        */
        <div
          id={listId}
          className="min-h-0 overflow-y-auto px-panel pt-1 pb-panel"
        >
          {tags.length === 0 ? (
            <p className="py-2 text-xs text-content-muted">
              노드의 메모 패널에서 태그를 추가할 수 있습니다.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = tag.id === selectedTagId;

                return (
                  <li
                    key={tag.id}
                    className={`flex h-7 max-w-full items-center rounded-full pr-1 text-xs ${
                      isSelected
                        ? "bg-warning-subtle font-medium text-warning-strong ring-1 ring-warning-line"
                        : "bg-surface-strong text-content-secondary"
                    }`}
                  >
                    <button
                      type="button"
                      title={tag.name}
                      aria-pressed={isSelected}
                      onClick={() => onSelectTag(tag.id)}
                      className="h-full min-w-0 truncate rounded-l-full pr-1 pl-2.5 hover:underline focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
                    >
                      {tag.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`${tag.name} 태그 삭제`}
                      onClick={() => onDeleteTag(tag.id)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
                        isSelected
                          ? "text-warning hover:bg-warning-line hover:text-warning-strong"
                          : "text-content-muted hover:bg-surface hover:text-content"
                      }`}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
