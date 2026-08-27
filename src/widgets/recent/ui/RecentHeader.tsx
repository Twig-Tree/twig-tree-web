"use client";

import { useState } from "react";
import { FolderPathPickerModal } from "@/src/features/folder/select-folder-path";
import { NewWorkspaceButton } from "@/src/features/workspace/create-workspace";

interface RecentHeaderProps {
  onSelectFolderPath: (folderParentId: string | null) => void; // 워크스페이스를 만들 위치를 확정했을 때 실행할 callback. 루트는 null
}

/*
함수 이름 : RecentHeader
기능 : 최신순 화면의 제목과 워크스페이스 추가 진입점을 표시하고, 폴더 경로 선택 팝업의 열림 상태를 관리한다.
인자 : RecentHeaderProps
반환값 : 최신순 화면 상단 영역

열림 상태는 페이지가 아니라 트리거와 팝업을 함께 가진 이 컴포넌트가 소유한다.
페이지 최상위에 두면 팝업을 열고 닫을 때마다 워크스페이스 목록까지 함께 다시 그려진다.
*/
export function RecentHeader({ onSelectFolderPath }: RecentHeaderProps) {
  const [isFolderPathPickerOpen, setIsFolderPathPickerOpen] = useState(false);

  return (
    <>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Recent
        </h1>

        <NewWorkspaceButton
          onClick={() => setIsFolderPathPickerOpen(true)}
          className="sm:ml-auto"
        />
      </header>

      <FolderPathPickerModal
        isOpen={isFolderPathPickerOpen}
        onClose={() => setIsFolderPathPickerOpen(false)}
        onSelect={onSelectFolderPath}
      />
    </>
  );
}
