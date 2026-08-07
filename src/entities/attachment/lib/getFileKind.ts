import { FILE_KIND_BY_EXTENSION } from "../model/constants";
import type { FileKind } from "../model/types";

/*
함수 이름 : getFileExtension
기능 : 파일 이름에서 소문자 확장자를 추출한다.
인자 : string fileName -> 확장자를 포함한 파일 이름
반환값 : 확장자. 확장자가 없으면 빈 문자열

마지막 점이 맨 앞에 있는 이름(.gitignore 등)은 확장자가 없는 것으로 본다.
*/
const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0) return "";

  return fileName.slice(lastDotIndex + 1).toLowerCase();
};

/*
함수 이름 : getFileKind
기능 : 파일 이름의 확장자로 화면 표시용 파일 분류를 결정한다.
인자 : string fileName -> 확장자를 포함한 파일 이름
반환값 : FileKind

mimeType을 보지 않는다. hwp와 hwpx는 브라우저가 mimeType을 비우거나
application/octet-stream으로 넘기는 경우가 많아 확장자가 더 신뢰할 수 있다.
*/
export const getFileKind = (fileName: string): FileKind =>
  FILE_KIND_BY_EXTENSION[getFileExtension(fileName)] ?? "unknown";

/*
함수 이름 : isAcceptedFileName
기능 : 첨부할 수 있는 확장자인지 확인한다.
인자 : string fileName -> 확장자를 포함한 파일 이름
반환값 : 첨부 가능 여부
*/
export const isAcceptedFileName = (fileName: string) =>
  getFileKind(fileName) !== "unknown";
