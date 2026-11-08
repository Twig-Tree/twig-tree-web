import { type LectureGenerationResponseDTO } from "../api/types";
import { type LectureGenerationResponse } from "../model/generation/generationResponse";

/*
함수 이름 : mapLectureGenerationResponseDtoToDomain
기능 : 강의 시나리오 생성 응답 DTO를 도메인 모델로 바꾼다.
인자 : LectureGenerationResponseDTO dto -> 백엔드 응답의 data
반환값 : 모델 응답 원본과 생성 측정값
*/
export const mapLectureGenerationResponseDtoToDomain = (
  dto: LectureGenerationResponseDTO,
): LectureGenerationResponse => ({
  responseText: dto.responseText,
  model: dto.model,
  promptVersion: dto.promptVersion,
  usage: {
    inputTokens: dto.usage.inputTokens,
    outputTokens: dto.usage.outputTokens,
  },
  attemptCount: dto.attemptCount,
});
