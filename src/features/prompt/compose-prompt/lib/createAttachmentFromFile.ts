import type { AttachmentItem } from "@/src/entities/attachment";

/*
함수 이름 : createAttachmentFromFile
기능 : 브라우저 File 객체를 화면에서 사용할 첨부 파일 모델로 변환한다.
인자 : File file -> 사용자가 선택한 파일
반환값 : AttachmentItem

id는 목록에서 항목을 구분하기 위한 클라이언트 전용 값이다.
서버에 업로드하는 흐름이 생기면 응답으로 받은 파일 ID를 별도 필드로 갖게 된다.
*/
export const createAttachmentFromFile = (file: File): AttachmentItem => ({
  id: `attachment_${crypto.randomUUID()}`,
  mimeType: file.type,
  name: file.name,
  sizeInBytes: file.size,
});
