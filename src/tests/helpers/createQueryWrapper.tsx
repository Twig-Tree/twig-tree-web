import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/*
함수 이름 : createQueryWrapper
기능 : query hook과 컴포넌트 테스트에 필요한 QueryClientProvider wrapper를 만든다.
인자 : 없음
반환값 : renderHook과 render의 wrapper로 넘길 컴포넌트

호출할 때마다 새 QueryClient를 만들어 이전 테스트의 캐시가 다음 테스트에 남지 않게 한다.
재시도는 끈다. 켜 두면 실패를 검사하는 테스트가 재시도가 끝날 때까지 기다린다.
*/
export const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};
