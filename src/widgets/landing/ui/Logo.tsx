type LogoTone = "default" | "inverse";

interface LogoMarkProps {
  size?: number; // 한 변의 픽셀 크기
  tone?: LogoTone; // inverse는 브랜드 바탕 위에서 쓰는 흰 줄기와 옅은 잎
}

const STEM_CLASS: Record<LogoTone, string> = {
  default: "stroke-landing-ink",
  inverse: "stroke-landing-on-brand",
};

const LEAF_CLASS: Record<LogoTone, string> = {
  default: "fill-landing-leaf",
  inverse: "fill-landing-leaf-pale",
};

export function LogoMark({ size = 32, tone = "default" }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 45V27M24 31C24 24 17 22 12 20M24 31C24 24 31 22 36 20"
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
        className={STEM_CLASS[tone]}
      />
      <circle cx="10" cy="19" r="5.5" className={LEAF_CLASS[tone]} />
      <circle cx="38" cy="19" r="5.5" className={LEAF_CLASS[tone]} />
      <path
        d="M24 27C17 22 17 11 24 4C31 11 31 22 24 27Z"
        className={LEAF_CLASS[tone]}
      />
    </svg>
  );
}

interface WordmarkProps {
  className?: string; // 글자 크기처럼 놓이는 자리마다 다른 값
}

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <span
      className={`font-extrabold tracking-[-0.03em] text-landing-ink ${className}`}
    >
      twig<span className="text-landing-brand">tree</span>
    </span>
  );
}
