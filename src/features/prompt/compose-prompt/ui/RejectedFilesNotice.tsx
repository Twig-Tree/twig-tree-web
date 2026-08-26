import { X } from "lucide-react";
import {
  ACCEPTED_FILE_EXTENSIONS,
  formatFileSize,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/src/entities/attachment";
import { IconButton } from "@/src/shared/ui/icon-button";
import type { RejectedFile } from "../model/types";

interface RejectedFilesNoticeProps {
  files: RejectedFile[]; // 첨부하지 못한 파일과 그 사유
  onDismiss: () => void;
}

/*
함수 이름 : RejectedFilesNotice
기능 : 첨부하지 못한 파일을 사유별로 묶어 알리고, 사유마다 다음에 무엇을 바꿔야 하는지 함께 안내한다.
인자 : RejectedFilesNoticeProps
반환값 : 안내 문구 영역. 알릴 파일이 없으면 아무것도 표시하지 않는다

파일 선택 직후 나타나는 안내이므로 role="alert"로 스크린 리더에도 즉시 전달한다.
확장자와 크기를 한 문장으로 합치면 어느 파일에 무엇을 고쳐야 하는지 알 수 없어 사유별로 나눈다.
*/
export function RejectedFilesNotice({
  files,
  onDismiss,
}: RejectedFilesNoticeProps) {
  if (files.length === 0) return null;

  const namesByExtension = files
    .filter((file) => file.reason === "extension")
    .map((file) => file.name);

  const namesBySize = files
    .filter((file) => file.reason === "size")
    .map((file) => file.name);

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {namesByExtension.length > 0 ? (
          <div>
            <p className="font-medium">
              첨부할 수 없는 형식입니다: {namesByExtension.join(", ")}
            </p>
            <p className="mt-0.5 text-amber-700">
              지원 형식: {ACCEPTED_FILE_EXTENSIONS.join(", ")}
            </p>
          </div>
        ) : null}

        {namesBySize.length > 0 ? (
          <div>
            <p className="font-medium">
              용량이 너무 큽니다: {namesBySize.join(", ")}
            </p>
            <p className="mt-0.5 text-amber-700">
              최대 {formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}까지 첨부할 수
              있습니다.
            </p>
          </div>
        ) : null}
      </div>

      <IconButton aria-label="안내 닫기" size="sm" onClick={onDismiss}>
        <X />
      </IconButton>
    </div>
  );
}
