"use client";

import { AttachmentChip } from "@/src/entities/attachment";
import { ChatInput } from "@/src/shared/ui/chat-input";
import type { PromptDraft } from "../model/types";
import { useComposePrompt } from "../model/useComposePrompt";
import { AttachFileButton } from "./AttachFileButton";
import { RejectedFilesNotice } from "./RejectedFilesNotice";

interface PromptComposerProps {
  isSubmitting?: boolean; // 상위 요청이 진행 중인 동안 전송을 잠근다
  onSubmit: (draft: PromptDraft) => void; // 작성이 끝난 입력을 상위로 전달한다
  placeholder?: string; // 화면마다 다른 안내 문구
}

/*
함수 이름 : PromptComposer
기능 : 첨부 파일 목록, 안내 문구, 채팅 입력 바를 하나의 입력 영역으로 조합한다.
인자 : PromptComposerProps
반환값 : 프롬프트 작성 영역

대시보드와 워크스페이스 페이지가 같은 컴포넌트를 사용하고, 전송 후 동작만 onSubmit으로 달라진다.
*/
export function PromptComposer({
  isSubmitting = false,
  onSubmit,
  placeholder,
}: PromptComposerProps) {
  const {
    addFiles,
    attachments,
    dismissRejection,
    isAttachDisabled,
    isSubmitDisabled,
    rejectedFiles,
    removeAttachment,
    setText,
    submitPrompt,
    text,
  } = useComposePrompt({ isSubmitting, onSubmit });

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <AttachmentChip
                attachment={attachment}
                onRemove={() => removeAttachment(attachment.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <RejectedFilesNotice files={rejectedFiles} onDismiss={dismissRejection} />

      <ChatInput
        value={text}
        onChange={setText}
        onSubmit={submitPrompt}
        placeholder={placeholder}
        isSubmitDisabled={isSubmitDisabled}
        actions={
          <AttachFileButton onSelect={addFiles} isDisabled={isAttachDisabled} />
        }
      />
    </div>
  );
}
