import { MAX_ATTACHMENT_SIZE_BYTES } from "../model/constants";

/*
함수 이름 : isAcceptedFileSize
기능 : 첨부할 수 있는 크기인지 확인한다.
인자 : number sizeInBytes -> File.size로 얻은 파일 크기
반환값 : 첨부 가능 여부

크기가 0인 파일은 상한과 무관하므로 여기서 거르지 않는다. 빈 파일을 막을지는
첨부 정책이 아니라 업로드 대상 API가 정할 문제다.
*/
export const isAcceptedFileSize = (sizeInBytes: number) =>
  sizeInBytes <= MAX_ATTACHMENT_SIZE_BYTES;
