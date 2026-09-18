"use client";

import { useCallback, useState } from "react";
import {
  type AttachmentItem,
  MAX_ATTACHMENT_COUNT,
} from "@/src/entities/attachment";
import { MAX_PROMPT_MESSAGE_LENGTH } from "@/src/entities/tree";
import { createAttachmentFromFile } from "../lib/createAttachmentFromFile";
import { splitAcceptedFiles } from "../lib/splitAcceptedFiles";
import type { PromptDraft, RejectedFile } from "./types";

interface UseComposePromptParams {
  isSubmitting: boolean; // 상위 요청이 진행 중인 동안 전송을 잠근다
  onSubmit: (draft: PromptDraft) => void | Promise<void>; // 작성이 끝난 입력을 상위로 전달한다. Promise를 돌려주면 성공한 경우에만 입력을 비운다
}

/*
함수 이름 : useComposePrompt
기능 : 프롬프트 입력값과 첨부 파일 목록을 클라이언트 상태로 관리하고, 허용하지 않는 파일을 걸러 안내 대상으로 남긴다.
인자 : UseComposePromptParams
반환값 : 입력값과 첨부 목록, 이를 변경하는 핸들러, 전송 가능 여부

전송 결과가 무엇인지는 알지 못한다. 워크스페이스 생성인지 트리 수정인지는 onSubmit을 넘긴 화면이 결정한다.
*/
export function useComposePrompt({
  isSubmitting,
  onSubmit,
}: UseComposePromptParams) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);

  /*
  백엔드가 500자를 넘는 지시문을 거절한다. 트리 생성은 응답까지 1분 가까이 걸릴 수 있어,
  기다린 끝에 길이 때문에 실패하지 않도록 전송 전에 막는다.
  */
  const isMessageTooLong = text.trim().length > MAX_PROMPT_MESSAGE_LENGTH;

  const isSubmitDisabled =
    isSubmitting || text.trim().length === 0 || isMessageTooLong;
  const isAttachDisabled = attachments.length >= MAX_ATTACHMENT_COUNT;

  /*
  파일을 새로 선택할 때마다 이전 안내를 지운다. 방금 선택한 파일에 대한 안내만 남기기 위해서다.
  */
  const addFiles = useCallback((files: File[]) => {
    const { acceptedFiles, rejectedFiles: rejected } =
      splitAcceptedFiles(files);

    setRejectedFiles(rejected);

    if (acceptedFiles.length === 0) return;

    /*
    요청 하나에 파일 하나만 보낼 수 있으므로 개수를 넘기지 않도록 자른다.
    첨부가 이미 있으면 첨부 버튼이 잠기기 때문에 화면에서는 여기까지 오지 않지만,
    드래그 앤 드롭처럼 다른 경로가 생겨도 개수 제약이 깨지지 않도록 남겨 둔다.
    */
    setAttachments((current) =>
      [...current, ...acceptedFiles.map(createAttachmentFromFile)].slice(
        0,
        MAX_ATTACHMENT_COUNT,
      ),
    );
  }, []);

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    );
  }, []);

  const dismissRejection = useCallback(() => setRejectedFiles([]), []);

  /*
  입력을 상위로 넘기고, 처리가 끝난 뒤에 작성 상태를 비운다.
  실패했을 때 비우면 1분 가까이 기다린 사용자가 지시문과 첨부를 처음부터 다시 만들어야 한다.
  상위가 Promise를 돌려주지 않으면 await가 그대로 통과하므로 넘긴 직후 비워진다.
  */
  const submitPrompt = useCallback(async () => {
    if (isSubmitDisabled) return;

    try {
      await onSubmit({ attachments, text: text.trim() });
    } catch {
      // 실패 안내는 onSubmit을 넘긴 화면이 한다. 여기서는 입력을 남기는 것만 책임진다.
      return;
    }

    setText("");
    setAttachments([]);
    setRejectedFiles([]);
  }, [attachments, isSubmitDisabled, onSubmit, text]);

  return {
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
  };
}
