"use client";

import { Pencil } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { WorkspaceItem } from "@/src/entities/workspace";
import { EditableWorkspaceName } from "@/src/features/workspace/update-workspace";

export interface WorkspaceHeaderProps {
  workspace: WorkspaceItem | undefined; // 조회가 끝나기 전에는 undefined. 이름을 보여주고, 이름 수정 시 속한 폴더로 중복을 검사한다
  isNameLoading?: boolean; // 이름을 처음 불러오는 중이라 자리표시자를 보여줄지 여부
}

/*
함수 이름 : WorkspaceHeader
기능 : 워크스페이스 이름을 제목으로 보여주고, 제목을 누르면 그 자리에서 이름을 수정하게 한다.
인자 : WorkspaceHeaderProps
반환값 : 워크스페이스 화면 상단의 헤더 바

편집 입력창은 편집을 시작할 때만 그린다. 입력창이 형제 목록을 조회해 중복을 검사하므로,
늘 그려 두면 워크스페이스에 들어올 때마다 쓰지 않을 목록 요청이 나간다.
저장하면 mutation이 상세 캐시를 응답으로 덮으므로 제목은 따로 고치지 않아도 새 이름이 된다.
*/
export function WorkspaceHeader({
  workspace,
  isNameLoading = false,
}: WorkspaceHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const titleButtonRef = useRef<HTMLButtonElement>(null);

  /*
  Enter나 Escape로 끝나면 focus를 가진 입력창이 사라져 focus가 문서 처음으로 떨어지므로 제목 버튼으로 되돌린다.
  다른 곳을 눌러 끝났다면 사용자가 옮긴 focus를 빼앗지 않는다.
  */
  const handleEditingEnd = useCallback(() => {
    setIsEditing(false);

    requestAnimationFrame(() => {
      const { activeElement } = document;

      if (activeElement === null || activeElement === document.body) {
        titleButtonRef.current?.focus();
      }
    });
  }, []);

  const renderTitle = () => {
    if (isNameLoading || !workspace) {
      return (
        <h1 className="min-w-0 text-base font-semibold text-content">
          <span className="sr-only">
            워크스페이스 이름을 불러오는 중입니다.
          </span>
          {/*
          자리표시자의 높이를 text-base의 line-height에 맞춰, 이름이 도착해도 헤더 안에서 흔들리지 않게 한다.
          */}
          <span
            className="block h-6 w-40 animate-pulse rounded-control bg-surface-strong"
            aria-hidden="true"
          />
        </h1>
      );
    }

    /*
    편집 중에도 제목은 화면 구조에 남긴다. 입력창으로 바뀌는 동안 화면에서 h1이 사라지지 않게 한다.
    */
    if (isEditing) {
      return (
        <>
          <h1 className="sr-only">{workspace.name}</h1>
          <EditableWorkspaceName
            workspace={workspace}
            onEditingEnd={handleEditingEnd}
          />
        </>
      );
    }

    /*
    제목의 이름은 워크스페이스 이름 그대로 읽히게 두고, 수정할 수 있다는 사실은 설명으로 덧붙인다.
    버튼 이름이나 h1 안에 넣으면 h1의 이름까지 함께 바뀌므로 설명은 h1 밖에 둔다.
    */
    return (
      <>
        <h1 className="-ml-2 min-w-0 text-base font-semibold text-content">
          <button
            ref={titleButtonRef}
            type="button"
            aria-describedby="workspace-header-rename-hint"
            onClick={() => setIsEditing(true)}
            className="group flex max-w-full items-center gap-1.5 rounded-control px-2 py-0.5 leading-6 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <span className="truncate">{workspace.name}</span>
            <Pencil
              className="h-3.5 w-3.5 shrink-0 text-content-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            />
          </button>
        </h1>
        <span id="workspace-header-rename-hint" className="sr-only">
          눌러서 이름을 수정합니다.
        </span>
      </>
    );
  };

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-line bg-surface px-5">
      {renderTitle()}
    </header>
  );
}
