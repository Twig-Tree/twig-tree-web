/*
첨부할 수 있는 파일 확장자. 파일 선택 창의 필터와 첨부 단계의 검증이 같은 목록을 사용한다.
*/
export const ACCEPTED_FILE_EXTENSIONS = [
  "txt",
  "md",
  "pdf",
  "docx",
  "hwp",
  "hwpx",
] as const;

/*
input[type=file]의 accept 속성 값. 파일 선택 창에서 허용 확장자만 보이게 한다.
accept는 사용자가 우회할 수 있으므로 검증을 대신하지는 못한다.
*/
export const FILE_INPUT_ACCEPT = ACCEPTED_FILE_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");
