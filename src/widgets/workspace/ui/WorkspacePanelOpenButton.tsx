import { PanelLeftOpen } from "lucide-react";

export interface WorkspacePanelOpenButtonProps {
  onOpen: () => void; // 닫힌 워크스페이스 패널을 연다.
}

/*
함수 이름 : WorkspacePanelOpenButton
기능 : 워크스페이스 패널이 닫혀 있을 때 캔버스 위에 띄우는 열기 버튼을 그린다. 캔버스가 좁으면 아이콘만 보인다.
인자 : WorkspacePanelOpenButtonProps
반환값 : 패널 열기 버튼
*/
export function WorkspacePanelOpenButton({
  onOpen,
}: WorkspacePanelOpenButtonProps) {
  return (
    <button
      type="button"
      aria-label="검색·태그 패널 열기"
      title="검색·태그 패널 열기"
      onClick={onOpen}
      className="flex h-10 items-center gap-1.5 rounded-card border border-line bg-surface px-3 text-[13px] font-medium whitespace-nowrap text-content-secondary shadow-control transition-colors hover:bg-surface-hover hover:text-content focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
    >
      <PanelLeftOpen aria-hidden className="size-4" strokeWidth={2} />
      <span className="hidden @2xl:inline">검색·태그</span>
    </button>
  );
}
