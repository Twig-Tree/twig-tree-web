import type { FileKind } from "./types";

/*
첨부할 수 있는 확장자와 그 확장자의 표시 분류를 함께 정의한다.
첨부 허용 여부와 파일 종류 표시가 같은 목록을 보도록 이 맵을 단일 출처로 사용한다.
*/
export const FILE_KIND_BY_EXTENSION: Record<string, FileKind> = {
  txt: "text",
  md: "text",
  pdf: "pdf",
  docx: "word",
  hwp: "hwp",
  hwpx: "hwp",
};

export const ACCEPTED_FILE_EXTENSIONS = Object.keys(FILE_KIND_BY_EXTENSION);

/*
input[type=file]의 accept 속성 값. 파일 선택 창에서 허용 확장자만 보이게 한다.
accept는 사용자가 우회할 수 있으므로 검증을 대신하지는 못한다.
*/
export const FILE_INPUT_ACCEPT = ACCEPTED_FILE_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");
