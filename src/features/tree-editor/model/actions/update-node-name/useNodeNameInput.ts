import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type NodeNameEditorLocation,
  useEditingStore,
} from "../../sync/editingStore";
import { useIsMounted } from "@/src/shared/lib/react/useIsMounted";
import { useUpdateNodeName } from "./useUpdateNodeName";

/*
편집이 끝난 원인. Enter·Escape는 사용자가 입력창 안에서 끝낸 것이고, blur는 다른 곳으로 옮겨 가며 끝난 것이다.
호출부는 이 값으로 focus를 되돌릴지 정한다. blur로 끝났다면 사용자가 옮긴 곳이 있으므로 되돌리지 않는다.
*/
export type NodeNameEditingEndReason = "keyboard" | "blur";

const NAME_CONFLICT_MESSAGE =
  "다른 곳에서 수정되었습니다. Enter로 덮어쓰거나 Esc로 취소할 수 있습니다.";

interface UseNodeNameInputParams {
  treeId: string | null; // 노드가 속한 트리 ID. 트리를 불러오기 전에는 null이라 편집을 시작하지 않는다
  clientId: string; // 제목을 수정할 노드의 편집기 노드 ID
  serverId: string | null; // 같은 노드의 서버 ID, 아직 저장 전이면 null
  label: string; // 지금 저장된 제목. 편집을 시작하거나 취소할 때 입력값을 이 값으로 맞춘다
  location: NodeNameEditorLocation; // 이 입력창이 열리는 곳. 같은 노드를 다른 곳에서 편집 중이면 열지 않는다
  onEditingEnd?: (reason: NodeNameEditingEndReason) => void; // 저장이나 취소로 입력창이 닫힌 뒤 부른다. 원인에 따라 focus를 되돌릴지 정한다
}

/*
함수 이름 : useNodeNameInput
기능 : 노드 제목 입력창의 열림, 입력값, 오류 문구, 충돌 대기 상태를 관리하고 Enter, blur, Escape에 따라 저장하거나 편집을 취소한다.
인자 : UseNodeNameInputParams
반환값 : 입력창 ref, 편집 여부, 입력값, 오류 문구, 수정 중 여부, 편집 시작 함수, 입력창 이벤트 handler

저장은 useUpdateNodeName이 맡고, 이 hook은 그 결과를 입력창 상태로 옮긴다. 캔버스 노드와 메모 패널이 같은 흐름을 쓰고 모양만 다르다.
입력창이 열려 있는 동안 editingStore에 알려, 다른 곳의 변경이 입력 중인 노드를 덮어쓰지 않게 한다.
한 노드에는 입력창을 하나만 연다. 두 곳에서 열면 검증 실패나 충돌 안내로 남은 입력창이 서로 focus를 가져가며 blur 저장을 일으킨다.
*/
export const useNodeNameInput = ({
  treeId,
  clientId,
  serverId,
  label,
  location,
  onEditingEnd,
}: UseNodeNameInputParams) => {
  const startNodeNameEditing = useEditingStore(
    (state) => state.startNodeNameEditing,
  );
  const endNodeNameEditing = useEditingStore(
    (state) => state.endNodeNameEditing,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(label);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false); // 다른 곳의 수정과 충돌해 사용자의 결정을 기다리는 중인지
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittingRef = useRef(false);
  const isCancellingRef = useRef(false);
  const isMounted = useIsMounted();

  const { getNodeNameError, updateNodeName, isUpdatingNodeName } =
    useUpdateNodeName({
      treeId: treeId ?? "",
      clientId,
      serverId,
    });

  /*
  편집을 시작하면 기존 제목을 바로 덮어쓸 수 있도록 입력값 전체를 선택한다.
  */
  useEffect(() => {
    if (!isEditing) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  /*
  입력 중에 다른 곳의 변경을 반영하지 않도록 알린다. 입력 중인 노드가 접혀서 사라져도 cleanup이 해제한다.
  */
  useEffect(() => {
    if (!isEditing) return;

    startNodeNameEditing(clientId, location);

    return () => endNodeNameEditing(clientId, location);
  }, [clientId, endNodeNameEditing, isEditing, location, startNodeNameEditing]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const startEditing = useCallback(() => {
    if (!treeId) return;
    if (useEditingStore.getState().nameEditors.has(clientId)) return; // 다른 곳에서 이미 편집 중이다.

    setName(label);
    setErrorMessage(null);
    setHasConflict(false);
    setIsEditing(true);
  }, [clientId, label, treeId]);

  /*
  요청을 기다리는 동안 입력창이 사라졌다면 onEditingEnd를 부르지 않는다. 메모 패널은 노드를 바꾸면 입력창을 새로 그리므로,
  사라진 입력창의 결과로 focus를 옮기면 사용자가 방금 고른 노드의 화면을 건드린다.
  */
  const endEditing = useCallback(
    (reason: NodeNameEditingEndReason) => {
      setIsEditing(false);
      setErrorMessage(null);
      setHasConflict(false);
      isCancellingRef.current = false;

      if (isMounted()) onEditingEnd?.(reason);
    },
    [isMounted, onEditingEnd],
  );

  /*
  현재 입력값을 검증한 뒤 제목 수정을 요청한다.
  검증이나 요청이 실패하면 편집 상태를 유지하고 입력창으로 focus를 되돌린다.
  */
  const commitName = useCallback(
    async (reason: NodeNameEditingEndReason) => {
      if (isCommittingRef.current || isCancellingRef.current) return;

      const validationError = getNodeNameError(name);

      if (validationError) {
        setErrorMessage(validationError);
        focusInput();
        return;
      }

      isCommittingRef.current = true; // Enter와 blur가 연속으로 발생해도 요청은 한 번만 보낸다.
      setErrorMessage(null);
      setHasConflict(false);

      const result = await updateNodeName(name);

      isCommittingRef.current = false;

      if (result === "saved") {
        endEditing(reason);
        return;
      }

      if (result === "notFound") {
        alert("다른 곳에서 삭제된 노드입니다.");
        endEditing(reason);
        return;
      }

      if (result === "conflict") {
        setHasConflict(true);
        setErrorMessage(NAME_CONFLICT_MESSAGE);
        focusInput();
        return;
      }

      setErrorMessage("제목을 저장하지 못했습니다. 다시 시도해 주세요.");
      focusInput();
    },
    [endEditing, focusInput, getNodeNameError, name, updateNodeName],
  );

  /*
  충돌 안내는 입력을 고쳐도 남긴다. 사용자가 Enter나 Esc로 정할 때까지 알아야 하는 내용이다.
  */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setName(event.target.value);
      if (!hasConflict) setErrorMessage(null);
    },
    [hasConflict],
  );

  /*
  충돌 뒤에는 version이 최신으로 맞춰져 있어, 다른 곳을 누른 것만으로 저장하면 사용자의 결정 없이 덮어쓴다.
  */
  const handleBlur = useCallback(() => {
    if (hasConflict) return;

    void commitName("blur");
  }, [commitName, hasConflict]);

  /*
  Escape는 서버 요청 없이 원래 제목으로 되돌리고, Enter는 한글 조합이 끝난 경우에만 저장한다.
  */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        isCancellingRef.current = true; // 편집 종료 과정에서 발생하는 blur 저장을 막는다.
        setName(label);
        endEditing("keyboard");
        return;
      }

      if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

      event.preventDefault();
      void commitName("keyboard");
    },
    [commitName, endEditing, label],
  );

  return {
    inputRef,
    isEditing,
    name,
    errorMessage,
    isUpdatingNodeName,
    startEditing,
    handleBlur,
    handleChange,
    handleKeyDown,
  };
};
