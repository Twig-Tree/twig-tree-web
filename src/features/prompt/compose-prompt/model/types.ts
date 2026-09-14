import type { AttachmentItem } from "@/src/entities/attachment";

export type PromptDraft = {
  attachments: AttachmentItem[];
  text: string; // 앞뒤 공백을 제거한 입력값
};

/*
첨부하지 못한 사유. 안내 문구가 사유마다 달라 구분해서 보관한다.
extension은 지원 형식을, size는 크기 상한을 알려 줘야 한다.
*/
export type RejectedFileReason = "extension" | "size";

export type RejectedFile = {
  name: string; // 확장자를 포함한 파일 이름
  reason: RejectedFileReason;
};
