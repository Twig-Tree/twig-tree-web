import type { FolderItem } from "@/src/entities/folder";
import { validateNameLength } from "@/src/shared/lib/validation/validateNameLength";

interface ValidateFolderNameParams {
  folderId: string; // 검사 대상 폴더 ID. 중복 검사에서 자기 자신을 제외하는 데 사용한다
  folders: FolderItem[]; // 이름 중복을 검사할 형제 폴더 목록
  name: string; // 사용자가 입력한 폴더 이름
}

/*
함수 이름 : validateFolderName
기능 : 폴더 이름 입력값이 저장 가능한지 검사한다. 길이 정책은 이름 공용 검증에 맡기고, 같은 위치의 이름 중복만 폴더 고유 규칙으로 확인한다.
인자 : ValidateFolderNameParams
반환값 : 오류 안내 문구, 통과하면 null
*/
export function validateFolderName({
  folderId,
  folders,
  name,
}: ValidateFolderNameParams): string | null {
  const lengthError = validateNameLength(name, "폴더");

  if (lengthError) {
    return lengthError;
  }

  const trimmedName = name.trim();

  const isDuplicateName = folders.some(
    (folder) => folder.id !== folderId && folder.name.trim() === trimmedName,
  );

  if (isDuplicateName) {
    return "같은 위치에 동일한 이름의 폴더가 있습니다.";
  }

  return null;
}
