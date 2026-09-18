import {
  MAX_DOCUMENT_ATTACHMENT_SIZE_BYTES,
  MAX_PLAIN_TEXT_ATTACHMENT_SIZE_BYTES,
} from "../model/constants";
import { getFileKind } from "./getFileKind";

/*
함수 이름 : getMaxAttachmentSizeBytes
기능 : 파일 이름으로 그 파일에 적용할 크기 상한을 고른다.
인자 : string fileName -> 확장자를 포함한 파일 이름
반환값 : 바이트 단위 상한

평문과 문서를 확장자 목록으로 다시 나누지 않고 FileKind로 가른다. 백엔드의 PlainTextParser가
담당하는 확장자(txt, md)가 "text" 분류와 정확히 같아, 목록을 복제하면 두 곳이 어긋날 수 있다.
허용하지 않는 확장자는 이 함수에 닿기 전에 걸러지므로 문서 상한으로 떨어져도 무방하다.
*/
export const getMaxAttachmentSizeBytes = (fileName: string): number =>
  getFileKind(fileName) === "text"
    ? MAX_PLAIN_TEXT_ATTACHMENT_SIZE_BYTES
    : MAX_DOCUMENT_ATTACHMENT_SIZE_BYTES;

/*
함수 이름 : isAcceptedFileSize
기능 : 첨부할 수 있는 크기인지 확인한다. 상한이 확장자마다 다르므로 이름을 함께 받는다.
인자 : string fileName -> 확장자를 포함한 파일 이름
number sizeInBytes -> File.size로 얻은 파일 크기
반환값 : 첨부 가능 여부

크기가 0인 파일은 상한과 무관하므로 여기서 거르지 않는다. 빈 파일을 막을지는
첨부 정책이 아니라 업로드 대상 API가 정할 문제다.
*/
export const isAcceptedFileSize = (fileName: string, sizeInBytes: number) =>
  sizeInBytes <= getMaxAttachmentSizeBytes(fileName);
