import type { FileKind } from "../model/types";

const EXTENSION_KINDS: Record<string, FileKind> = {
  docx: "word",
  hwp: "hwp",
  hwpx: "hwp",
  md: "text",
  pdf: "pdf",
  txt: "text",
};

/*
mimeType은 브라우저와 OS에 따라 값이 달라서 보조 판단 기준으로만 사용한다.
특히 hwp와 hwpx는 빈 문자열이나 application/octet-stream으로 넘어오는 경우가 많다.
*/
const MIME_TYPE_KINDS: Record<string, FileKind> = {
  "application/haansofthwp": "hwp",
  "application/pdf": "pdf",
  "application/vnd.hancom.hwp": "hwp",
  "application/vnd.hancom.hwpx": "hwp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "word",
  "application/x-hwp": "hwp",
  "text/markdown": "text",
  "text/plain": "text",
};

/*
함수 이름 : getFileKind
기능 : 파일 이름의 확장자를 우선 기준으로 파일 분류를 결정하고, 확장자로 판단할 수 없을 때만 mimeType을 확인한다.
인자 : string mimeType -> 브라우저가 판별한 MIME 타입. 판별에 실패하면 빈 문자열
string fileName -> 확장자를 포함한 파일 이름
반환값 : FileKind

허용 확장자가 문서 형식으로 한정되어 있어 확장자가 mimeType보다 신뢰할 수 있다.
*/
export const getFileKind = (mimeType: string, fileName: string): FileKind => {
  /*
  확장자가 없거나 마지막 점이 파일 이름 맨 앞에 있으면(.gitignore 등) 확장자로 판단하지 않는다.
  */
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex > 0) {
    const extension = fileName.slice(lastDotIndex + 1).toLowerCase();
    const extensionKind = EXTENSION_KINDS[extension];

    if (extensionKind) return extensionKind;
  }

  return MIME_TYPE_KINDS[mimeType.toLowerCase()] ?? "unknown";
};
