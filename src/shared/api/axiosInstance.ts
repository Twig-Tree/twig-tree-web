import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

/*
API 서버 주소 환경변수가 설정되지 않은 경우 잘못된 주소로 요청되는 것을 방지한다.
*/
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.");
}

export const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
