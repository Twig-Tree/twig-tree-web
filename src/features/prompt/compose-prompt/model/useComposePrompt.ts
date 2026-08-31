"use client";

import { useCallback, useState } from "react";
import {
  type AttachmentItem,
  MAX_ATTACHMENT_COUNT,
} from "@/src/entities/attachment";
import { createAttachmentFromFile } from "../lib/createAttachmentFromFile";
import { splitAcceptedFiles } from "../lib/splitAcceptedFiles";
import type { PromptDraft, RejectedFile } from "./types";

interface UseComposePromptParams {
  isSubmitting: boolean; // 상위 요청이 진행 중인 동안 전송을 잠근다
  onSubmit: (draft: PromptDraft) => void; // 작성이 끝난 입력을 상위로 전달한다
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

  const isSubmitDisabled = isSubmitting || text.trim().length === 0;
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
  입력을 상위로 넘긴 뒤 작성 상태를 비운다.
  서버 요청이 붙으면 요청이 성공한 시점에 비우도록 옮겨야 한다.
  */
  const submitPrompt = useCallback(() => {
    if (isSubmitDisabled) return;

    onSubmit({ attachments, text: text.trim() });

    setText("");
    setAttachments([]);
    setRejectedFiles([]);
  }, [attachments, isSubmitDisabled, onSubmit, text]);

  return {
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
  };
}
