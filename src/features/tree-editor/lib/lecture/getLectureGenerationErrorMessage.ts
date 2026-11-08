import axios from "axios";
import { LECTURE_ERROR_CODE } from "@/src/entities/lecture";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { type GenerateLectureResult } from "../../model/lecture/useGenerateLecture";

/*
함수 이름 : getRequestErrorMessage
기능 : 강의 생성 요청의 오류를 사용자가 다음에 할 일을 알 수 있는 문구로 바꾼다.
인자 : unknown error -> 생성 요청이 던진 오류
반환값 : 안내 문구
*/
const getRequestErrorMessage = (error: unknown): string => {
  /*
  프론트가 먼저 끊은 경우다. 백엔드가 재시도까지 마치는 시간보다 길게 잡았으므로 드물다.
  */
  if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
    return "강의를 만드는 데 너무 오래 걸립니다. 잠시 후 다시 시도해 주세요.";
  }

  switch (getApiErrorCode(error)) {
    case LECTURE_ERROR_CODE.SCHEMA_VERSION_MISMATCH:
      return "서버가 아직 이 버전의 강의를 만들 수 없습니다. 잠시 후 다시 시도해 주세요.";
    case LECTURE_ERROR_CODE.RESPONSE_TRUNCATED:
      return "강의가 너무 길어 끝까지 만들지 못했습니다. 범위를 좁혀 다시 요청해 주세요.";
    case LECTURE_ERROR_CODE.MODEL_REFUSED:
      return "AI가 이 요청으로는 강의를 만들지 않았습니다. 요청을 바꿔 다시 시도해 주세요.";
    case LECTURE_ERROR_CODE.LLM_TIMEOUT:
      return "AI 응답이 늦어 강의를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return "강의를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
};

/*
함수 이름 : getLectureGenerationErrorMessage
기능 : 강의 생성 결과가 실패이면 화면에 보여 줄 문구를 만든다.
인자 : GenerateLectureResult result -> useGenerateLecture의 결과
반환값 : 안내 문구. 성공했으면 null
*/
export const getLectureGenerationErrorMessage = (
  result: GenerateLectureResult,
): string | null => {
  switch (result.status) {
    case "success":
      return null;
    case "invalid":
      return result.message;
    case "request-error":
      return getRequestErrorMessage(result.error);
    /*
    json 단계 실패는 응답이 잘렸거나 거절된 것이라 같은 요청을 다시 보내면 될 수 있다.
    그 밖은 repair까지 거쳤는데도 트리와 맞지 않은 것이라 요청을 바꾸는 편이 낫다.
    */
    case "failure":
      return result.failedStep === "json"
        ? "AI 응답을 읽지 못했습니다. 다시 시도해 주세요."
        : "만든 강의가 이 트리와 맞지 않습니다. 요청을 바꿔 다시 시도해 주세요.";
  }
};
