import type { AttachmentItem } from "@/src/entities/attachment";

export type PromptDraft = {
  attachments: AttachmentItem[];
  text: string; // 앞뒤 공백을 제거한 입력값
};
