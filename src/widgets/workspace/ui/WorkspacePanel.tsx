"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  getTaggedNodeResults,
  type NodeResult,
  useDeleteTreeTag,
  useHighlightResults,
  useNodeSearch,
  useTagResults,
  useTreeStore,
  useTreeTags,
} from "@/src/features/tree-editor";
import { IconButton } from "@/src/shared/ui/icon-button";
import { NodeResultList } from "./NodeResultList";
import { NodeSearchInput } from "./NodeSearchInput";
import { WorkspaceTagList } from "./WorkspaceTagList";

export interface WorkspacePanelProps {
  onSelectResult: (result: NodeResult) => void; // 결과 항목을 눌렀을 때 페이지가 할 일. 포커싱과 메모 패널 열기
  isResultSelectDisabled: boolean; // 노드 추가·삭제 요청 중이면 true
  onFitNodes: (clientIds: string[]) => void; // 태그를 골랐을 때 그 태그가 붙은 노드들을 한 화면에 모은다
  isOpen: boolean; // 닫혀도 검색어와 고른 태그를 유지하도록 패널을 지우지 않고 숨긴다
  isOverlay: boolean; // 좁은 화면이면 캔버스를 밀어내지 않고 그 위에 겹쳐 띄운다
  onClose: () => void; // 닫기 버튼을 눌렀을 때
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
  onFitNodes,
  isOpen,
  isOverlay,
  onClose,
}: WorkspacePanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(isOpen);

  /*
  닫혀 있던 패널을 열면 바로 검색할 수 있도록 검색창에 focus를 둔다. 처음 그릴 때는 화면 focus를 빼앗지 않는다.
  */
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      panelRef.current
        ?.querySelector<HTMLInputElement>('input[aria-label="노드 검색"]')
        ?.focus();
    }

    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const [keyword, setKeyword] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const { tags } = useTreeTags();
  const { handleDeleteTreeTag } = useDeleteTreeTag();

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
  같은 태그를 다시 누르면 선택을 풀어 결과와 강조를 지운다. 화면은 되돌리지 않는다.
  새 태그를 고르면 그 태그가 붙은 노드들을 한 화면에 모은다. 선택은 바꾸지 않는다.
  결과는 다음 렌더에 만들어지므로, 모을 노드는 이 순간의 store에서 바로 찾는다.
  */
  const handleSelectTag = (tagId: string) => {
    setKeyword("");

    if (tagId === activeTagId) {
      setSelectedTagId(null);
      return;
    }

    setSelectedTagId(tagId);

    const { nodes } = useTreeStore.getState();
    onFitNodes(
      getTaggedNodeResults(nodes, tagId).map((result) => result.clientId),
    );
  };

  return (
    <aside
      ref={panelRef}
      id="workspace-panel"
      aria-label="워크스페이스 패널"
      data-camera-inset="left"
      hidden={!isOpen}
      className={`absolute inset-y-0 left-0 flex h-full w-64 shrink-0 flex-col bg-surface-muted shadow-panel ${
        isOverlay ? "z-30" : "z-10"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between pt-2 pr-1.5 pl-panel">
        <h2 className="text-xs font-semibold text-content-muted">노드 찾기</h2>
        <IconButton
          size="sm"
          aria-label="검색·태그 패널 닫기"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </IconButton>
      </div>

      <div className="shrink-0 px-panel pt-1 pb-panel">
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
      <div className="min-h-0 flex-1 overflow-y-auto px-panel pb-panel">
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
        onDeleteTag={(tagId) => void handleDeleteTreeTag(tagId)}
      />
    </aside>
  );
}
