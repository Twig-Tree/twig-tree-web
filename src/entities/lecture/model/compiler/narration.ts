import { type ScenarioNarration } from "../scenario/types";
import { type LectureNarration } from "../types";

/*
음성이 없을 때 쓰는 글자당 재생 시간(ms). 데모 대본 43개 비트의 fallbackDurationMs를 글자 수로 나눈 값의
중앙값이다(91~152ms). 음성 합성이 붙으면 실제 길이를 쓰므로 이 값은 자막만 있을 때의 기준이다.
*/
export const NARRATION_MS_PER_CHARACTER = 110;

/*
아주 짧은 문장도 읽을 시간을 남긴다.
*/
export const MIN_NARRATION_DURATION_MS = 1500;

/*
함수 이름 : getLectureNarration
기능 : 시나리오 내레이션 문장에 글자 수로 계산한 재생 시간을 붙인다.
글자는 코드 포인트로 센다. 이모지처럼 UTF-16 두 칸을 쓰는 글자를 두 번 세지 않기 위해서다.
인자 : ScenarioNarration narration -> 모델이 낸 문장
반환값 : 대본의 내레이션
*/
export const getLectureNarration = ({
  text,
}: ScenarioNarration): LectureNarration => ({
  text,
  fallbackDurationMs: Math.max(
    MIN_NARRATION_DURATION_MS,
    [...text].length * NARRATION_MS_PER_CHARACTER,
  ),
});
