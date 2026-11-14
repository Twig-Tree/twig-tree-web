"use client";

import { AttachmentChip } from "@/src/entities/attachment";
import { MAX_PROMPT_MESSAGE_LENGTH } from "@/src/entities/tree";
import { ChatInput } from "@/src/shared/ui/chat-input";
import type { PromptDraft } from "../model/types";
import { useComposePrompt } from "../model/useComposePrompt";
import { useFileDropZone } from "../model/useFileDropZone";
import { AttachFileButton } from "./AttachFileButton";
import { RejectedFilesNotice } from "./RejectedFilesNotice";

interface PromptComposerProps {
  isSubmitting?: boolean; // 상위 요청이 진행 중인 동안 전송을 잠근다
  onSubmit: (draft: PromptDraft) => Promise<void>; // 작성이 끝난 입력을 상위로 전달한다. resolve하면 입력이 비워지고, reject하면 남는다
  placeholder?: string; // 화면마다 다른 안내 문구
}

/*
함수 이름 : PromptComposer
기능 : 첨부 파일 목록, 안내 문구, 채팅 입력 바를 하나의 입력 영역으로 조합하고, 영역 전체를 파일 드롭 대상으로 만든다.
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
    attachDisabledReason,
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

  /*
  드롭은 클립 버튼과 같은 addFiles로 보낸다. 확장자·크기·개수 검사와 생성 중 잠금이
  한곳에 있어 첨부 경로가 늘어도 규칙이 갈리지 않는다.
  */
  const { dropZoneProps, isDraggingOver } = useFileDropZone({
    isDisabled: isAttachDisabled,
    onDrop: addFiles,
  });

  return (
    <div className="relative flex flex-col gap-2" {...dropZoneProps}>
      {attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              {/*
              생성 중에는 onRemove를 넘기지 않는다. AttachmentChip이 제거 버튼을 숨기고
              읽기 전용으로 표시하므로, 이미 나간 요청의 첨부를 목록에서만 지우는 일이 없다.
              */}
              <AttachmentChip
                attachment={attachment}
                onRemove={
                  isSubmitting
                    ? undefined
                    : () => removeAttachment(attachment.id)
                }
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
        isReadOnly={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
        actions={
          <AttachFileButton
            onSelect={addFiles}
            isDisabled={isAttachDisabled}
            disabledReason={attachDisabledReason ?? undefined}
          />
        }
      />

      {/*
      길이를 넘긴 동안에만 알린다. 상한에 가까워질 때부터 글자 수를 세어 보여주면
      평소 입력에 계속 따라붙는데, 500자는 평범한 지시문이 닿지 않는 길이다.

      입력창 아래에 둔다. 상한을 넘겼다는 것은 입력이 길다는 뜻이고, 그때 textarea는
      최대 높이까지 자라 있다. 위에 두면 안내가 화면 밖으로 밀려 잠긴 전송 버튼만 남는다.
      */}
      {isMessageTooLong ? (
        <p role="alert" className="px-1 text-xs text-warning">
          지시문은 최대 {MAX_PROMPT_MESSAGE_LENGTH}자까지 보낼 수 있습니다. 현재{" "}
          {text.trim().length}자입니다.
        </p>
      ) : null}

      {/*
      끄는 동안 영역 전체를 덮어 어디에 놓아도 첨부된다는 것을 보여 준다. 잠겨 있으면
      첨부 버튼과 같은 이유를 띄워, 놓기 전에 받지 않는다는 것을 알 수 있게 한다.

      pointer-events-none으로 두어 덮개가 drag 이벤트의 대상이 되지 않게 한다. 대상이 되면
      덮개가 나타나는 순간 아래 요소에서 dragleave가 발생해 강조가 깜빡인다.
      마우스로만 일어나는 일이라 스크린 리더에는 알리지 않는다.
      */}
      {isDraggingOver ? (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-card border-2 border-dashed bg-surface px-4 text-center text-sm ${
            isAttachDisabled
              ? "border-line-strong text-content-muted"
              : "border-accent-line text-content-secondary"
          }`}
        >
          {isAttachDisabled ? attachDisabledReason : "여기에 놓아 파일 첨부"}
        </div>
      ) : null}
    </div>
  );
}
