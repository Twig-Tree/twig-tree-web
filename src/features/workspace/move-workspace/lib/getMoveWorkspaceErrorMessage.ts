import { FOLDER_ERROR_CODE } from "@/src/entities/folder";
import { WORKSPACE_ERROR_CODE } from "@/src/entities/workspace";

/*
함수 이름 : getMoveWorkspaceErrorMessage
기능 : 워크스페이스 이동 실패의 백엔드 에러 코드를 위치 선택 팝업에 띄울 안내 문구로 바꾼다.
인자 : string | null errorCode -> 응답 봉투의 에러 코드. 응답이 없으면 null
반환값 : 안내 문구. 분기하지 않는 코드는 다시 시도를 권하는 문구
*/
export function getMoveWorkspaceErrorMessage(errorCode: string | null): string {
  switch (errorCode) {
    case WORKSPACE_ERROR_CODE.DUPLICATE_WORKSPACE_NAME:
      return "옮길 위치에 같은 이름의 워크스페이스가 있습니다.";
    case FOLDER_ERROR_CODE.FOLDER_NOT_FOUND:
      return "옮길 위치를 찾을 수 없습니다. 목록을 새로 고친 뒤 다시 골라 주세요.";
    default:
      return "워크스페이스를 옮기지 못했습니다. 다시 시도해 주세요.";
  }
}
