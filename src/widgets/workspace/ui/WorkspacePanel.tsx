"use client";

import { useState } from "react";
import { type NodeResult, useNodeSearch } from "@/src/features/tree-editor";
import { NodeResultList } from "./NodeResultList";
import { NodeSearchInput } from "./NodeSearchInput";

export interface WorkspacePanelProps {
  onSelectResult: (result: NodeResult) => void; // 결과 항목을 눌렀을 때 페이지가 할 일. 포커싱과 메모 패널 열기
  isResultSelectDisabled: boolean; // 노드 추가·삭제 요청 중이면 true
}

/*
함수 이름 : WorkspacePanel
기능 : 캔버스 왼쪽에 노드 검색창과 결과 목록을 그린다. 검색어는 서버에 저장하지 않는 화면 상태라 패널 안에서만 갖는다.
인자 : WorkspacePanelProps
반환값 : 워크스페이스 패널
*/
export function WorkspacePanel({
  onSelectResult,
  isResultSelectDisabled,
}: WorkspacePanelProps) {
  const [keyword, setKeyword] = useState("");

  const { results, hasKeyword } = useNodeSearch(keyword);

  return (
    <aside
      aria-label="워크스페이스 패널"
      className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white"
    >
      <div className="shrink-0 p-3">
        <NodeSearchInput
          value={keyword}
          onChange={setKeyword}
          onClear={() => setKeyword("")}
        />
      </div>

      {/*
      검색어가 없으면 목록을 그리지 않는다. "일치하는 노드가 없습니다"는 검색어를 넣었을 때만 의미가 있다.
      */}
      {hasKeyword ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <NodeResultList
            results={results}
            emptyMessage="일치하는 노드가 없습니다."
            onSelect={onSelectResult}
            isSelectDisabled={isResultSelectDisabled}
          />
        </div>
      ) : null}
    </aside>
  );
}
