import { File, FileText, FileType, type LucideIcon } from "lucide-react";
import type { FileKind } from "../model/types";

/*
파일 분류별로 아이콘과 색을 함께 관리한다.
아이콘 라이브러리 의존을 이 파일 하나로 제한해, 라이브러리를 교체해도 다른 컴포넌트가 영향을 받지 않게 한다.
*/
const KIND_STYLES: Record<FileKind, { Icon: LucideIcon; className: string }> = {
  hwp: { Icon: FileType, className: "bg-emerald-50 text-emerald-600" },
  pdf: { Icon: FileText, className: "bg-red-50 text-red-500" },
  text: { Icon: FileText, className: "bg-slate-100 text-slate-500" },
  unknown: { Icon: File, className: "bg-slate-100 text-slate-400" },
  word: { Icon: FileText, className: "bg-blue-50 text-blue-500" },
};

interface FileTypeIconProps {
  kind: FileKind;
}

/*
함수 이름 : FileTypeIcon
기능 : 파일 분류에 맞는 아이콘과 배경색을 적용한 정사각 배지를 표시한다.
인자 : FileTypeIconProps
반환값 : 파일 종류를 나타내는 배지 요소

파일 이름 옆에 함께 표시하는 장식 요소이므로 스크린 리더에서는 숨긴다.
*/
export function FileTypeIcon({ kind }: FileTypeIconProps) {
  const { Icon, className } = KIND_STYLES[kind];

  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${className}`}
    >
      <Icon className="size-5" />
    </span>
  );
}
