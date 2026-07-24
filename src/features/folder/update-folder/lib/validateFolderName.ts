import type { FolderItem } from "@/src/entities/folder";

export const MAX_FOLDER_NAME_BYTES = 40;

interface ValidateFolderNameParams {
  folderId: string;
  folders: FolderItem[];
  name: string;
}

export function getFolderNameByteLength(name: string) {
  return new TextEncoder().encode(name).length;
}

export function validateFolderName({
  folderId,
  folders,
  name,
}: ValidateFolderNameParams): string | null {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "폴더 이름을 입력해 주세요.";
  }

  if (getFolderNameByteLength(trimmedName) > MAX_FOLDER_NAME_BYTES) {
    return "폴더 이름은 최대 40바이트까지 입력할 수 있습니다.";
  }

  const isDuplicateName = folders.some(
    (folder) => folder.id !== folderId && folder.name.trim() === trimmedName,
  );

  if (isDuplicateName) {
    return "같은 위치에 동일한 이름의 폴더가 있습니다.";
  }

  return null;
}
