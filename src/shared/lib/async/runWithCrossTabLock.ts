/*
함수 이름 : runWithCrossTabLock
기능 : 같은 origin의 모든 탭에서 같은 이름의 작업이 한 번에 하나씩만 실행되게 한다. 다른 탭이 락을 잡고 있으면 풀릴 때까지 기다린 뒤 실행한다.
인자 : string name -> 탭끼리 공유하는 락 이름
() => Promise<TResult> operation -> 락을 잡은 동안 실행할 비동기 작업
반환값 : operation의 결과. operation이 실패하면 같은 오류로 reject한다
*/
export const runWithCrossTabLock = async <TResult>(
  name: string,
  operation: () => Promise<TResult>,
): Promise<TResult> => {
  /*
  Web Locks API는 secure context(HTTPS, localhost)에서만 제공되고 SSR에는 navigator가 없다.
  락을 쓸 수 없는 환경에서 작업 자체를 막으면 기능이 멈추므로, 탭 간 순서 보장만 포기하고 바로 실행한다.
  */
  if (typeof navigator === "undefined" || !navigator.locks) {
    return operation();
  }

  /*
  콜백이 돌려준 promise가 끝날 때 락이 풀리고, request는 그 결과로 resolve·reject한다.
  */
  return navigator.locks.request(name, () => operation());
};
