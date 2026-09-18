"use client";

import { AttachmentChip } from "@/src/entities/attachment";
import { MAX_PROMPT_MESSAGE_LENGTH } from "@/src/entities/tree";
import { ChatInput } from "@/src/shared/ui/chat-input";
import type { PromptDraft } from "../model/types";
import { useComposePrompt } from "../model/useComposePrompt";
import { AttachFileButton } from "./AttachFileButton";
import { RejectedFilesNotice } from "./RejectedFilesNotice";

interface PromptComposerProps {
  isSubmitting?: boolean; // 상위 요청이 진행 중인 동안 전송을 잠근다
  onSubmit: (draft: PromptDraft) => void | Promise<void>; // 작성이 끝난 입력을 상위로 전달한다. Promise를 돌려주면 성공한 경우에만 입력이 비워진다
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
    isMessageTooLong,
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
        onSubmit={() => void submitPrompt()}
        placeholder={placeholder}
        isSubmitDisabled={isSubmitDisabled}
        actions={
          <AttachFileButton onSelect={addFiles} isDisabled={isAttachDisabled} />
        }
      />

      {/*
      길이를 넘긴 동안에만 알린다. 상한에 가까워질 때부터 글자 수를 세어 보여주면
      평소 입력에 계속 따라붙는데, 500자는 평범한 지시문이 닿지 않는 길이다.

      입력창 아래에 둔다. 상한을 넘겼다는 것은 입력이 길다는 뜻이고, 그때 textarea는
      최대 높이까지 자라 있다. 위에 두면 안내가 화면 밖으로 밀려 잠긴 전송 버튼만 남는다.
      */}
      {isMessageTooLong ? (
        <p role="alert" className="px-1 text-xs text-amber-700">
          지시문은 최대 {MAX_PROMPT_MESSAGE_LENGTH}자까지 보낼 수 있습니다. 현재{" "}
          {text.trim().length}자입니다.
        </p>
      ) : null}
    </div>
  );
}
