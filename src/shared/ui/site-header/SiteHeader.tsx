import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/src/shared/ui/logo";

/*
fixed  : 소개 페이지. 테마를 따르지 않는 고정 팔레트를 쓴다.
themed : 앱 화면. 사용자가 고른 테마를 따른다.
*/
type SiteHeaderTone = "fixed" | "themed";

const TONE_CLASS: Record<
  SiteHeaderTone,
  { header: string; focusRing: string }
> = {
  fixed: {
    header: "bg-landing-surface",
    focusRing:
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-brand",
  },
  themed: {
    header: "bg-surface",
    focusRing:
      "focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
  },
};

interface SiteHeaderProps {
  homeHref: string; // 로고를 눌렀을 때 갈 주소
  homeLabel: string; // 로고 링크의 이름. 로고 이미지는 대체 텍스트를 비운다.
  tone: SiteHeaderTone;
  actions?: ReactNode; // 오른쪽에 놓는 링크나 버튼
  hasDivider?: boolean; // 아래 본문과 경계선으로 나눌지
}

/*
함수 이름 : SiteHeader
기능 : 소개 페이지와 앱 화면이 함께 쓰는 상단바를 그린다. 모양은 같고 색만 화면의 규칙(고정 팔레트 또는 테마)을 따른다.
인자 : SiteHeaderProps
반환값 : 로고 링크와 오른쪽 영역을 담은 header
*/
export function SiteHeader({
  homeHref,
  homeLabel,
  tone,
  actions,
  hasDivider = false,
}: SiteHeaderProps) {
  const toneClass = TONE_CLASS[tone];

  return (
    <header
      className={`shrink-0 ${toneClass.header} ${hasDivider ? "border-b border-line" : ""}`}
    >
      <div className="flex min-h-12 w-full items-center justify-between gap-4 px-6 py-1">
        {/*
        헤더는 화면 전체 폭을 쓰고 로고는 왼쪽 끝에 둔다. 로고 이미지 왼쪽의 투명 여백은 음수 margin으로 상쇄한다.
        */}
        <Link
          href={homeHref}
          aria-label={homeLabel}
          className={`-ml-4 rounded-full ${toneClass.focusRing}`}
        >
          <Logo
            alt=""
            tone={tone === "fixed" ? "fixed" : "themed"}
            isEager
            className="h-16"
          />
        </Link>
        {actions}
      </div>
    </header>
  );
}
