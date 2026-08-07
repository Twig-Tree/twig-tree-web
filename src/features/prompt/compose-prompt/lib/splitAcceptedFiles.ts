import { isAcceptedFileName } from "@/src/entities/attachment";

/*
함수 이름 : splitAcceptedFiles
기능 : 선택한 파일을 첨부할 수 있는 파일과 없는 파일로 나눈다.
인자 : File[] files -> 사용자가 선택하거나 끌어다 놓은 파일 목록
반환값 : 허용 파일 목록과 거부된 파일 이름 목록

허용 확장자 판단은 entity가 담당하고, 이 함수는 안내에 필요한 형태로 나누는 일만 한다.
*/
export const splitAcceptedFiles = (files: File[]) => {
  const acceptedFiles: File[] = [];
  const rejectedFileNames: string[] = [];

  for (const file of files) {
    if (isAcceptedFileName(file.name)) {
      acceptedFiles.push(file);
    } else {
      rejectedFileNames.push(file.name);
    }
  }

  return { acceptedFiles, rejectedFileNames };
};
