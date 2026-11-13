"use client";

import type { WorkspaceItem } from "@/src/entities/workspace";
import { useWorkspaceNameEditing } from "../model/useWorkspaceNameEditing";

interface EditableWorkspaceNameProps {
  workspace: WorkspaceItem; // 이름을 수정할 워크스페이스. 속한 폴더의 형제 목록으로 이름 중복을 검사한다
  onEditingEnd: () => void; // 저장 또는 취소 후 편집 상태를 종료하는 callback
}

/*
함수 이름 : EditableWorkspaceName
기능 : 워크스페이스 헤더의 제목 자리에 이름 입력창을 그린다. 입력·검증·저장 흐름은 카드와 같은 useWorkspaceNameEditing이 맡는다.
인자 : EditableWorkspaceNameProps
반환값 : 헤더 한 줄 안에서 이름을 수정하는 입력창

헤더는 높이가 고정된 한 줄이라 오류 문구를 아래에 이어 그리면 헤더가 늘어나 캔버스가 밀린다.
문구는 입력창 아래에 겹쳐 띄운다.
*/
export function EditableWorkspaceName({
  workspace,
  onEditingEnd,
}: EditableWorkspaceNameProps) {
  const {
    errorMessage,
    handleBlur,
    handleChange,
    handleKeyDown,
    inputRef,
    isUpdatingWorkspace,
    name,
  } = useWorkspaceNameEditing({ workspace, onEditingEnd });

  const errorId = `workspace-header-name-error-${workspace.id}`;

  return (
    <div className="relative w-full max-w-md min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={name}
        aria-label="워크스페이스 이름"
        aria-invalid={errorMessage !== null}
        aria-describedby={errorMessage ? errorId : undefined}
        disabled={isUpdatingWorkspace}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="-ml-2 w-full rounded-control border border-accent bg-surface px-2 py-0.5 text-base font-semibold leading-6 text-content outline-none ring-2 ring-accent-subtle disabled:cursor-wait disabled:bg-surface-muted"
      />
      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="absolute top-full left-0 z-20 mt-2 -ml-2 rounded-control border border-danger-line bg-danger-subtle px-2 py-1 text-xs font-medium text-danger shadow-overlay"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
