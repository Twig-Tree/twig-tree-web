import {
  isAcceptedFileName,
  isAcceptedFileSize,
} from "@/src/entities/attachment";
import type { RejectedFile } from "../model/types";

/*
함수 이름 : splitAcceptedFiles
기능 : 선택한 파일을 첨부할 수 있는 파일과 없는 파일로 나누고, 거부된 파일에는 사유를 함께 남긴다.
인자 : File[] files -> 사용자가 선택하거나 끌어다 놓은 파일 목록
반환값 : 허용 파일 목록과 사유가 붙은 거부 파일 목록

허용 확장자와 크기 상한 판단은 entity가 담당하고, 이 함수는 안내에 필요한 형태로 나누는 일만 한다.
확장자를 먼저 본다. 둘 다 어긋난 파일은 크기를 줄여도 첨부할 수 없으므로 확장자를 알리는 편이 낫다.
*/
export const splitAcceptedFiles = (files: File[]) => {
  const acceptedFiles: File[] = [];
  const rejectedFiles: RejectedFile[] = [];

  for (const file of files) {
    if (!isAcceptedFileName(file.name)) {
      rejectedFiles.push({ name: file.name, reason: "extension" });
      continue;
    }

    if (!isAcceptedFileSize(file.size)) {
      rejectedFiles.push({ name: file.name, reason: "size" });
      continue;
    }

    acceptedFiles.push(file);
  }

  return { acceptedFiles, rejectedFiles };
};
