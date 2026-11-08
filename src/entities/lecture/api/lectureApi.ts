import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  type GenerateLectureScenarioRequest,
  type GenerateLectureScenarioResponse,
} from "./types";
import { type LectureGenerationResponse } from "../model/generation/generationResponse";
import { mapLectureGenerationResponseDtoToDomain } from "../lib/mappers";

/*
모델 응답을 기다리는 시간. 백엔드는 모델 호출을 65초에서 끊고, 잘리거나 빈 응답이면 한 번 더 부른다.
그래서 한 요청이 130초까지 걸릴 수 있어 여유를 더해 잡는다. 이보다 짧으면 재시도 중에 프론트가 먼저 끊는다.
axiosInstance 기본값(10초)은 다른 요청을 위해 그대로 둔다.
*/
const GENERATE_LECTURE_SCENARIO_TIMEOUT_MS = 150_000;

export const lectureApi = {
  /*
  함수 이름 : generateLectureScenario
  기능 : 트리 outline과 요청 문장을 보내 모델이 만든 강의 시나리오 응답을 받는다. repair가 있으면 직전 응답을 고쳐 받는다.
  인자 : GenerateLectureScenarioRequest body -> 생성 요청 body
  반환값 : 파싱하지 않은 모델 응답과 생성 측정값

  백엔드는 응답을 파싱하거나 저장하지 않는다. 검사·컴파일·repair 판단은 호출한 쪽이 한다.
  */
  generateLectureScenario: async (
    body: GenerateLectureScenarioRequest,
  ): Promise<LectureGenerationResponse> => {
    const res = await axiosInstance.post<GenerateLectureScenarioResponse>(
      "/lecture-request",
      body,
      { timeout: GENERATE_LECTURE_SCENARIO_TIMEOUT_MS },
    );

    return mapLectureGenerationResponseDtoToDomain(res.data.data);
  },
};
