import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/*
함수 이름 : createQueryWrapper
기능 : query·mutation hook과 컴포넌트 테스트에 필요한 QueryClientProvider wrapper를 만든다.
인자 : 없음
반환값 : wrapper -> renderHook과 render의 wrapper로 넘길 컴포넌트
queryClient -> 캐시 상태를 직접 확인해야 하는 테스트가 쓸 QueryClient. wrapper가 내부에서 쓰는 것과 같은 인스턴스다

호출할 때마다 새 QueryClient를 만들어 이전 테스트의 캐시가 다음 테스트에 남지 않게 한다.
재시도는 끈다. 켜 두면 실패를 검사하는 테스트가 재시도가 끝날 때까지 기다린다.

queryClient를 함께 돌려주는 이유는 무효화 여부처럼 훅의 반환값만으로는 확인할 수 없는 캐시 상태를
검사하는 테스트가 있기 때문이다. 필요 없는 테스트는 wrapper만 꺼내 쓰면 된다.
*/
export const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  return { queryClient, wrapper };
};
