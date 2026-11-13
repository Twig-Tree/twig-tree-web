import { authApi } from "@/src/entities/auth/api/authApi";
import { useMutation } from "@tanstack/react-query";

/*
함수 이름 : useWithdrawMutation
기능 : 회원 탈퇴를 요청한다. 서버 데이터가 모두 사라지므로 개별 캐시를 갱신하지 않고, 캐시 정리는 세션을 끝내는 쪽이 맡는다.
인자 : 없음
반환값 : 회원 탈퇴 mutation
*/
export const useWithdrawMutation = () => {
  return useMutation({
    mutationFn: () => authApi.withdraw(),
  });
};
