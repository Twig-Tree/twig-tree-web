import axios, { AxiosError } from "axios";

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

/*
함수 이름 : isRequestTimeout
기능 : 응답을 기다리다 프론트의 timeout으로 끊은 오류인지 판정한다. 서버는 요청을 받아 아직 처리 중이거나 이미 끝냈을 수 있다.
인자 : unknown error -> axios가 reject한 오류 객체
반환값 : axios timeout이면 true. 서버가 응답한 오류, 네트워크 오류, 브라우저의 요청 중단은 false

timeout은 ETIMEDOUT으로 온다. xhr 어댑터는 axiosInstance의 transitional.clarifyTimeoutError가, fetch 어댑터는 기본 동작이 그렇게 알린다.
브라우저가 요청을 중단한 경우(페이지 이탈 등)는 ECONNABORTED로 와 여기서 걸러진다. 사용자가 기다린 끝에 생긴 일이 아니라 안내와 처리가 다르다.
*/
export const isRequestTimeout = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.code === AxiosError.ETIMEDOUT;
