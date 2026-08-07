import { X } from "lucide-react";
import { ACCEPTED_FILE_EXTENSIONS } from "@/src/entities/attachment";
import { IconButton } from "@/src/shared/ui/icon-button";

interface RejectedFilesNoticeProps {
  fileNames: string[]; // 첨부하지 못한 파일 이름 목록
  onDismiss: () => void;
}

/*
함수 이름 : RejectedFilesNotice
기능 : 허용하지 않는 확장자라 첨부하지 못한 파일을 알리고 지원 형식을 함께 안내한다.
인자 : RejectedFilesNoticeProps
반환값 : 안내 문구 영역. 알릴 파일이 없으면 아무것도 표시하지 않는다

파일 선택 직후 나타나는 안내이므로 role="alert"로 스크린 리더에도 즉시 전달한다.
*/
export function RejectedFilesNotice({
  fileNames,
  onDismiss,
}: RejectedFilesNoticeProps) {
  if (fileNames.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          첨부할 수 없는 파일입니다: {fileNames.join(", ")}
        </p>
        <p className="mt-0.5 text-amber-700">
          지원 형식: {ACCEPTED_FILE_EXTENSIONS.join(", ")}
        </p>
      </div>

      <IconButton aria-label="안내 닫기" size="sm" onClick={onDismiss}>
        <X />
      </IconButton>
    </div>
  );
}
