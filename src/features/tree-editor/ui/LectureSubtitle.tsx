import { useMemo } from "react";
import { useNarrationTypewriter } from "../model/lecture/useNarrationTypewriter";

type LectureSubtitleProps = {
  text: string; // 지금 비트의 내레이션 문장
  narrationDurationMs: number; // 지금 비트의 내레이션 시간
  isPlaying: boolean; // 강의가 재생 중인지
};

/*
함수 이름 : LectureSubtitle
기능 : 강의 자막을 한 글자씩 드러낸다. 아직 보이지 않는 글자도 자리를 차지해 줄바꿈과 높이가 처음부터 정해진다.
화면 읽기 도구에는 바뀌는 글자 대신 전체 문장을 한 번 알린다.
인자 : LectureSubtitleProps
반환값 : 강의 자막
*/
export function LectureSubtitle({
  text,
  narrationDurationMs,
  isPlaying,
}: LectureSubtitleProps) {
  const characters = useMemo(() => Array.from(text), [text]); // 한 글자를 둘로 쪼개지 않도록 code point로 나눈다.
  const revealedLength = useNarrationTypewriter({
    characterCount: characters.length,
    narrationDurationMs,
    isPlaying,
  });

  return (
    <div className="min-h-12 text-center text-base leading-relaxed text-content">
      <p aria-live="polite" className="sr-only">
        {text}
      </p>
      <p aria-hidden="true">
        <span>{characters.slice(0, revealedLength).join("")}</span>
        <span className="opacity-0">
          {characters.slice(revealedLength).join("")}
        </span>
      </p>
    </div>
  );
}
