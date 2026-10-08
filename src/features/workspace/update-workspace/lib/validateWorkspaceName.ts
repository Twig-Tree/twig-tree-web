import {
  MAX_WORKSPACE_NAME_LENGTH,
  type WorkspaceItem,
} from "@/src/entities/workspace";
import { validateNameLength } from "@/src/shared/lib/validation/validateNameLength";

interface ValidateWorkspaceNameParams {
  workspaceId: string; // 검사 대상 워크스페이스 ID. 중복 검사에서 자기 자신을 제외하는 데 사용한다
  workspaces: WorkspaceItem[]; // 이름 중복을 검사할 형제 워크스페이스 목록
  name: string; // 사용자가 입력한 워크스페이스 이름
}

/*
함수 이름 : validateWorkspaceName
기능 : 워크스페이스 이름 입력값이 저장 가능한지 검사한다. 길이 정책은 이름 공용 검증에 맡기고, 같은 위치의 이름 중복만 워크스페이스 고유 규칙으로 확인한다.
인자 : ValidateWorkspaceNameParams
반환값 : 오류 안내 문구, 통과하면 null

중복 기준은 백엔드 unique 인덱스와 같다. 인덱스는 저장된 문자열을 그대로 비교하므로 대소문자를 구분하고,
서버에는 앞뒤 공백을 자른 값을 보내므로 자른 값끼리 비교한다.
폴더와 워크스페이스는 인덱스가 따로라 같은 이름의 폴더는 중복으로 보지 않는다.
*/
export function validateWorkspaceName({
  workspaceId,
  workspaces,
  name,
}: ValidateWorkspaceNameParams): string | null {
  const lengthError = validateNameLength(
    name,
    "워크스페이스",
    MAX_WORKSPACE_NAME_LENGTH,
  );

  if (lengthError) {
    return lengthError;
  }

  const trimmedName = name.trim();

  const isDuplicateName = workspaces.some(
    (workspace) =>
      workspace.id !== workspaceId && workspace.name.trim() === trimmedName,
  );

  if (isDuplicateName) {
    return "같은 위치에 동일한 이름의 워크스페이스가 있습니다.";
  }

  return null;
}
