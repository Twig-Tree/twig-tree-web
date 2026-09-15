import axios from "axios";

/*
함수 이름 : isClientError
기능 : 서버가 4xx로 응답한 오류인지 판정한다. 같은 요청을 다시 보내도 결과가 같은 오류라 재시도 판단에 쓴다.
인자 : unknown error -> axios가 reject한 오류 객체
반환값 : 응답 status가 400 이상 500 미만이면 true. 응답이 없는 네트워크 오류는 false
*/
export const isClientError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }

  const { status } = error.response;

  return status >= 400 && status < 500;
};
