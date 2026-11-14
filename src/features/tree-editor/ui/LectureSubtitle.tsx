import { useMemo } from "react";
import { useNarrationTypewriter } from "../model/lecture/useNarrationTypewriter";

type LectureSubtitleProps = {
  text: string; // 지금 비트의 내레이션 문장
  narrationDurationMs: number; // 지금 비트의 내레이션 시간
  isPlaying: boolean; // 강의가 재생 중인지
  revealKey: string; // 바뀌면 글자를 처음부터 다시 드러낸다. 비트가 바뀌거나 같은 비트를 다시 재생할 때 바뀐다
};

type LectureSubtitleTextProps = Omit<LectureSubtitleProps, "revealKey">;

/*
함수 이름 : LectureSubtitleText
기능 : 자막 글자를 내레이션 시간에 맞춰 드러낸다. 아직 보이지 않는 글자도 자리를 차지해 줄바꿈과 높이가 처음부터 정해진다.
인자 : LectureSubtitleTextProps
반환값 : 화면 읽기 도구에는 숨긴 자막 글자
*/
function LectureSubtitleText({
  text,
  narrationDurationMs,
  isPlaying,
}: LectureSubtitleTextProps) {
  const characters = useMemo(() => Array.from(text), [text]); // 한 글자를 둘로 쪼개지 않도록 code point로 나눈다.
  const revealedLength = useNarrationTypewriter({
    characterCount: characters.length,
    narrationDurationMs,
    isPlaying,
  });

  return (
    <p aria-hidden="true">
      <span>{characters.slice(0, revealedLength).join("")}</span>
      <span className="opacity-0">
        {characters.slice(revealedLength).join("")}
      </span>
    </p>
  );
}

/*
함수 이름 : LectureSubtitle
기능 : 강의 자막을 한 글자씩 드러내고, 화면 읽기 도구에는 바뀌는 글자 대신 전체 문장을 알린다.
라이브 영역은 처음 들어 있던 내용이 아니라 이후 변경을 알리므로, 비트가 바뀌어도 라이브 영역은 그대로 두고
글자를 드러내는 부분만 revealKey로 새로 마운트한다.
인자 : LectureSubtitleProps
반환값 : 강의 자막
*/
export function LectureSubtitle({
  revealKey,
  ...textProps
}: LectureSubtitleProps) {
  return (
    <div className="min-h-12 text-center text-base leading-relaxed text-content">
      <p aria-live="polite" className="sr-only">
        {textProps.text}
      </p>
      <LectureSubtitleText key={revealKey} {...textProps} />
    </div>
  );
}
