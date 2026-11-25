import Image from "next/image";
import logoImage from "./Twig-Tree-logo.png";

/*
fixed   : 원본 색 그대로. 테마를 따르지 않는 소개 페이지의 밝은 바탕에서 쓴다.
inverse : 흰색 실루엣. 브랜드색처럼 진한 바탕에서 쓴다.
themed  : 제품 화면. 어두운 테마에서는 테마가 정한 필터로 밝힌다.
*/
type LogoTone = "fixed" | "inverse" | "themed";

const TONE_CLASS: Record<LogoTone, string> = {
  fixed: "",
  inverse: "brightness-0 invert",
  themed: "logo-themed",
};

interface LogoProps {
  className?: string; // 높이처럼 놓이는 자리마다 다른 값. 너비는 비율대로 따라간다.
  alt?: string; // 링크 안에서 링크가 이름을 가지면 빈 값으로 둔다.
  tone?: LogoTone;
  isEager?: boolean; // 첫 화면 위쪽에 보여 바로 불러와야 하는 경우
}

/*
이미지 왼쪽과 위아래에 투명 여백이 있다. 왼쪽 정렬이 필요한 자리에서는 음수 margin으로 상쇄한다.
*/
export function Logo({
  className = "",
  alt = "Twig Tree",
  tone = "themed",
  isEager = false,
}: LogoProps) {
  return (
    <Image
      src={logoImage}
      alt={alt}
      loading={isEager ? "eager" : "lazy"}
      className={`w-auto ${TONE_CLASS[tone]} ${className}`}
    />
  );
}
