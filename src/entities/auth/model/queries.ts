import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { memberQueryKeys } from "./queryKeys";

/*
함수 이름 : useGetMyInfoQuery
기능 : 로그인한 회원의 정보를 조회한다.
인자 : 없음
반환값 : 내 정보 조회 query

로그아웃하면 useLogout이 캐시를 비우므로, 다음에 로그인한 회원이 이전 회원의 정보를 보지 않는다.
*/
export function useGetMyInfoQuery() {
  return useQuery({
    queryKey: memberQueryKeys.me(),
    queryFn: () => authApi.getMyInfo(),
  });
}
