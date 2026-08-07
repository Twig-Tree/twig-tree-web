/*
화면에서 파일 종류별 아이콘과 라벨을 결정하기 위해 사용하는 정규화된 파일 분류.
백엔드 응답 값이 아니라 mimeType과 확장자로부터 프론트엔드에서 계산한다.

unknown은 허용하지 않는 확장자가 들어온 경우다. 첨부 단계에서 걸러내지만,
걸러지기 전에도 화면이 깨지지 않도록 분류를 남겨 둔다.
*/
export type FileKind = "pdf" | "word" | "hwp" | "text" | "unknown";

export type AttachmentItem = {
  id: string; // React key와 목록에서 항목을 제거할 때 사용하는 식별자
  mimeType: string; // 브라우저가 판별하지 못하면 빈 문자열일 수 있다
  name: string; // 확장자를 포함한 파일 이름
  sizeInBytes: number;
};
