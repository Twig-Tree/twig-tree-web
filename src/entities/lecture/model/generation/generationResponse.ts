import { type LectureGenerationUsage } from "./generationResult";

/*
백엔드가 돌려준 모델 응답. 시나리오 검사와 컴파일은 responseText로 프론트가 한다.
*/
export type LectureGenerationResponse = {
  responseText: string; // 파싱하지 않은 모델 응답 원본
  model: string; // 응답에 실린 모델 이름(스냅샷)
  promptVersion: string; // 모델·프롬프트별로 결과를 나누는 데 쓴다
  usage: LectureGenerationUsage; // 백엔드가 재시도했다면 모든 호출의 합
  attemptCount: number; // 백엔드가 모델을 부른 횟수(재시도 포함). repair 횟수와 다르다
};
