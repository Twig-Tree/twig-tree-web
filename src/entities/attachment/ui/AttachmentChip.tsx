import { X } from "lucide-react";
import { IconButton } from "@/src/shared/ui/icon-button";
import { formatFileSize } from "../lib/formatFileSize";
import { getFileKind } from "../lib/getFileKind";
import type { AttachmentItem, FileKind } from "../model/types";
import { FileTypeIcon } from "./FileTypeIcon";

const KIND_LABELS: Record<FileKind, string> = {
  hwp: "HWP DOCUMENT",
  pdf: "PDF DOCUMENT",
  text: "TEXT DOCUMENT",
  unknown: "FILE",
  word: "WORD DOCUMENT",
};

interface AttachmentChipProps {
  attachment: AttachmentItem;
  onRemove?: () => void; // 전달하지 않으면 제거 버튼을 숨기고 읽기 전용으로 표시한다
}

/*
함수 이름 : AttachmentChip
기능 : 첨부 파일 한 건의 아이콘, 이름, 크기와 종류를 표시하고 제거 버튼을 제공한다.
인자 : AttachmentChipProps
반환값 : 첨부 파일 카드 요소

목록에서 항목을 실제로 제거하는 책임은 갖지 않는다. 클릭 사실만 onRemove로 알린다.
*/
export function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  const kind = getFileKind(attachment.name);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <FileTypeIcon kind={kind} />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {attachment.name}
        </p>
        <p className="text-[11px] tracking-wide text-slate-400">
          {formatFileSize(attachment.sizeInBytes)} • {KIND_LABELS[kind]}
        </p>
      </div>

      {onRemove ? (
        <IconButton
          aria-label={`${attachment.name} 첨부 제거`}
          size="sm"
          onClick={onRemove}
          className="ml-1"
        >
          <X />
        </IconButton>
      ) : null}
    </div>
  );
}
