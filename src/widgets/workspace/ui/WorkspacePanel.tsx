"use client";

import { useState } from "react";
import {
  type NodeResult,
  useHighlightResults,
  useNodeSearch,
  useTagResults,
  useTreeTags,
} from "@/src/features/tree-editor";
import { NodeResultList } from "./NodeResultList";
import { NodeSearchInput } from "./NodeSearchInput";
import { WorkspaceTagList } from "./WorkspaceTagList";

export interface WorkspacePanelProps {
  onSelectResult: (result: NodeResult) => void; // 결과 항목을 눌렀을 때 페이지가 할 일. 포커싱과 메모 패널 열기
  isResultSelectDisabled: boolean; // 노드 추가·삭제 요청 중이면 true
}

/*
함수 이름 : WorkspacePanel
기능 : 캔버스 왼쪽에 노드 검색창, 결과 목록, 트리 태그 목록을 그린다. 검색어와 고른 태그는 서버에 저장하지 않는 화면 상태라 패널 안에서만 갖는다.
검색과 태그는 결과 목록과 강조를 번갈아 쓴다. 태그를 고르면 검색어를 지우고, 검색어를 입력하면 태그 선택을 푼다.
인자 : WorkspacePanelProps
반환값 : 워크스페이스 패널
*/
export function WorkspacePanel({
  onSelectResult,
  isResultSelectDisabled,
}: WorkspacePanelProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const { tags } = useTreeTags();

  /*
  고른 태그가 트리 태그 목록에서 사라졌으면 고르지 않은 것으로 본다. 태그를 지울 때 이 state를 따로 비우지 않아도 결과와 강조가 함께 풀린다.
  */
  const activeTagId = tags.some((tag) => tag.id === selectedTagId)
    ? selectedTagId
    : null;

  const { results: searchResults, hasKeyword } = useNodeSearch(keyword);
  const tagResults = useTagResults(activeTagId);

  const isTagActive = activeTagId !== null;
  const results = isTagActive ? tagResults : searchResults;

  useHighlightResults(results);

  const handleKeywordChange = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setSelectedTagId(null);
  };

  /*
  같은 태그를 다시 누르면 선택을 풀어 결과와 강조를 지운다.
  */
  const handleSelectTag = (tagId: string) => {
    setKeyword("");
    setSelectedTagId((currentTagId) => (currentTagId === tagId ? null : tagId));
  };

  return (
    <aside
      aria-label="워크스페이스 패널"
      className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white"
    >
      <div className="shrink-0 p-3">
        <NodeSearchInput
          value={keyword}
          onChange={handleKeywordChange}
          onClear={() => setKeyword("")}
        />
      </div>

      {/*
      검색어도 고른 태그도 없으면 목록을 그리지 않는다. "일치하는 노드가 없습니다"는 무언가를 찾았을 때만 의미가 있다.
      목록이 없을 때도 이 칸이 남은 높이를 차지해 태그 목록을 패널 맨 아래에 둔다.
      */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {hasKeyword || isTagActive ? (
          <NodeResultList
            results={results}
            emptyMessage={
              isTagActive
                ? "이 태그가 붙은 노드가 없습니다."
                : "일치하는 노드가 없습니다."
            }
            onSelect={onSelectResult}
            isSelectDisabled={isResultSelectDisabled}
          />
        ) : null}
      </div>

      <WorkspaceTagList
        tags={tags}
        selectedTagId={activeTagId}
        onSelectTag={handleSelectTag}
      />
    </aside>
  );
}
