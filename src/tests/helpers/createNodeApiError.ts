import { AxiosError, type AxiosResponse } from "axios";

/*
함수 이름 : createNodeApiError
기능 : 백엔드가 에러 코드와 함께 거절한 응답의 axios 오류를 만든다. API 함수를 spy로 대신할 때 거절을 흉내 낸다.
인자 : number status -> 응답 상태 코드
string code -> 응답 봉투의 에러 코드
반환값 : axios 오류
*/
export const createNodeApiError = (status: number, code: string) =>
  new AxiosError("rejected", undefined, undefined, undefined, {
    status,
    data: { isSuccess: false, code, message: "", data: null },
  } as AxiosResponse);
