"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { WorkspaceItem } from "@/src/entities/workspace";
import { useIsMounted } from "@/src/shared/lib/react/useIsMounted";
import { useUpdateWorkspace } from "./useUpdateWorkspace";

/*
편집이 끝난 원인. Enter·Escape는 사용자가 입력창 안에서 끝낸 것이고, blur는 다른 곳으로 옮겨 가며 끝난 것이다.
호출부는 이 값으로 focus를 되돌릴지 정한다. blur로 끝났다면 사용자가 옮긴 곳이 있으므로 되돌리지 않는다.
*/
export type WorkspaceNameEditingEndReason = "keyboard" | "blur";

interface UseWorkspaceNameEditingParams {
  workspace: WorkspaceItem; // 이름을 수정할 워크스페이스. 속한 폴더의 형제 목록으로 이름 중복을 검사한다
  onEditingEnd: (reason: WorkspaceNameEditingEndReason) => void; // 저장 또는 취소 후 편집 상태를 종료하는 callback
}

/*
함수 이름 : useWorkspaceNameEditing
기능 : 워크스페이스 이름 입력 상태를 관리하고 Enter, blur, Escape 이벤트에 따라 이름 저장 또는 편집 취소를 처리한다.
인자 : UseWorkspaceNameEditingParams
반환값 : 입력값, 오류 안내 문구, 입력창 ref, 수정 요청 중 여부, 입력창 이벤트 핸들러

카드와 워크스페이스 헤더가 같은 입력 흐름을 쓰고 모양만 다르다. 편집 UI가 마운트될 때 입력값 전체를 선택하므로,
편집을 시작할 때 마운트하고 끝나면 내리는 컴포넌트에서 사용한다.
*/
export function useWorkspaceNameEditing({
  workspace,
  onEditingEnd,
}: UseWorkspaceNameEditingParams) {
  const [name, setName] = useState(workspace.name);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittingRef = useRef(false);
  const isCancellingRef = useRef(false);
  const isMounted = useIsMounted();
  const { getWorkspaceNameError, isUpdatingWorkspace, updateWorkspace } =
    useUpdateWorkspace({ folderId: workspace.folderId });

  /*
  편집 UI로 전환되면 기존 이름을 바로 덮어쓸 수 있도록 입력값 전체를 선택한다.
  */
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  /*
  현재 입력값을 검증한 뒤 워크스페이스 이름 수정 요청을 보낸다.
  검증 또는 요청이 실패하면 편집 상태를 유지하고 입력창으로 focus를 되돌린다.
  */
  const commitName = useCallback(
    async (reason: WorkspaceNameEditingEndReason) => {
      if (isCommittingRef.current || isCancellingRef.current) return;

      const trimmedName = name.trim();

      if (trimmedName === workspace.name) {
        onEditingEnd(reason);
        return;
      }

      const validationError = getWorkspaceNameError({
        workspaceId: workspace.id,
        name,
      });

      if (validationError) {
        setErrorMessage(validationError);
        focusInput();
        return;
      }

      isCommittingRef.current = true; // Enter와 blur가 연속으로 발생해도 요청은 한 번만 보낸다.
      setErrorMessage(null);

      const isUpdated = await updateWorkspace({
        workspaceId: workspace.id,
        name,
      });

      isCommittingRef.current = false;

      /*
    요청을 기다리는 동안 다른 편집이 시작되면 이 편집 UI는 사라진다. 그때 onEditingEnd를 부르면
    사용자가 방금 연 편집이 닫히므로, 사라진 편집 UI의 요청 결과는 화면에 반영하지 않는다.
    */
      if (!isMounted()) return;

      if (isUpdated) {
        onEditingEnd(reason);
        return;
      }

      focusInput();
    },
    [
      focusInput,
      getWorkspaceNameError,
      isMounted,
      name,
      onEditingEnd,
      updateWorkspace,
      workspace.id,
      workspace.name,
    ],
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setErrorMessage(null);
  }, []);

  const handleBlur = useCallback(() => {
    void commitName("blur");
  }, [commitName]);

  /*
  Escape는 서버 요청 없이 최초 이름으로 복원하고, Enter는 한글 조합이 끝난 경우에만 저장한다.
  */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        isCancellingRef.current = true; // 편집 종료 과정에서 발생하는 blur 저장을 막는다.
        setName(workspace.name);
        setErrorMessage(null);
        onEditingEnd("keyboard");
        return;
      }

      if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

      event.preventDefault();
      void commitName("keyboard");
    },
    [commitName, onEditingEnd, workspace.name],
  );

  return {
    errorMessage,
    handleBlur,
    handleChange,
    handleKeyDown,
    inputRef,
    isUpdatingWorkspace,
    name,
  };
}
