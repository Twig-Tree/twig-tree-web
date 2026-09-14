import axios from "axios";
import {
  AUTH_ERROR_CODE,
  getApiErrorCode,
} from "@/src/shared/api/authErrorCodes";

/*
함수 이름 : getGoogleLoginErrorMessage
기능 : 백엔드 로그인 요청의 실패 원인에 맞는 안내 문구를 만든다. axios 오류 메시지는 사용자가 이해할 수 없으므로 그대로 보여주지 않는다.
인자 : unknown error -> 로그인 mutation이 reject한 오류 객체
반환값 : 로그인 화면에 보여줄 안내 문구
*/
export const getGoogleLoginErrorMessage = (error: unknown): string => {
  // 응답을 받지 못한 경우다. 네트워크 오류와 timeout이 여기에 해당한다.
  if (axios.isAxiosError(error) && !error.response) {
    return "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  const code = getApiErrorCode(error);

  if (code === AUTH_ERROR_CODE.INVALID_GOOGLE_ID_TOKEN) {
    return "Google 인증 정보를 확인하지 못했습니다. 다시 로그인해 주세요.";
  }

  if (code === AUTH_ERROR_CODE.TOKEN_STORE_UNAVAILABLE) {
    return "로그인 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.";
  }

  return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
};
