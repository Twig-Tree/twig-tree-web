import { useEffect, useState } from "react";
import { LectureAudioMode, playSentence } from "./lectureSpeech";
import { useLectureStore } from "./lectureStore";
import { useKoreanVoice } from "./useKoreanVoice";

/*
함수 이름 : useLecturePlayback
기능 : 강의 store의 재생 상태와 위치를 따라 지금 문장을 읽고, 다 읽으면 store를 다음 문장으로 넘긴다.
한국어 음성이 없거나 음성 합성이 실패하면 자막 시각만큼 기다리는 무음 재생으로 바꾼다.
인자 : 없음
반환값 : 지금 쓰는 재생 방식. 음성이 나오지 않는 것을 화면에 알리는 데 쓴다

화면에 한 번만 둔다. 둘 이상 두면 같은 문장을 두 번 읽고, 한 문장이 끝날 때 각자 넘기려 한다.
*/
export const useLecturePlayback = (): LectureAudioMode => {
  const status = useLectureStore((state) => state.status);
  const segments = useLectureStore((state) => state.segments);
  const segmentIndex = useLectureStore((state) => state.segmentIndex);
  const subtitleIndex = useLectureStore((state) => state.subtitleIndex);
  const completeSubtitle = useLectureStore((state) => state.completeSubtitle);

  const koreanVoice = useKoreanVoice();
  const [hasSpeechFailed, setHasSpeechFailed] = useState(false); // 한 번 실패하면 같은 화면에서는 다시 시도하지 않는다

  const audioMode: LectureAudioMode =
    koreanVoice !== null && !hasSpeechFailed ? "speech" : "silent";
  const voice = audioMode === "speech" ? koreanVoice : null;

  /*
  재생 중일 때 지금 위치의 문장 하나를 읽는다. 위치·재생 상태·재생 방식이 바뀌면 cleanup이 읽던 문장을 끊고 새로 시작한다.
  그래서 일시정지, 구간 이동, 언마운트가 모두 같은 경로로 이전 음성과 타이머를 정리한다.

  다 읽은 위치를 completeSubtitle에 함께 넘긴다. 끊긴 뒤 늦게 도착한 이벤트는 playSentence가 막고,
  그 사이 위치가 이미 바뀌었다면 store가 한 번 더 막는다.
  */
  useEffect(() => {
    if (status !== "playing") return;

    const subtitle = segments[segmentIndex]?.subtitles[subtitleIndex];

    if (!subtitle) {
      completeSubtitle(segmentIndex, subtitleIndex); // 문장이 없는 구간은 바로 넘긴다.
      return;
    }

    return playSentence({
      text: subtitle.text,
      durationMs: subtitle.endMs - subtitle.startMs,
      voice,
      onEnd: () => completeSubtitle(segmentIndex, subtitleIndex),
      onSpeechError: () => setHasSpeechFailed(true),
    });
  }, [status, segments, segmentIndex, subtitleIndex, voice, completeSubtitle]);

  return audioMode;
};
