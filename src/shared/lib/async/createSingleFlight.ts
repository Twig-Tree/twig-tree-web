/*
함수 이름 : createSingleFlight
기능 : 같은 작업이 이미 진행 중이면 새로 시작하지 않고 진행 중인 결과를 함께 기다리게 만든다. 작업이 끝나면 다음 호출부터 다시 새로 시작한다.
인자 : (...args: TArgs) => Promise<TResult> operation -> 중복 실행을 막을 비동기 작업
반환값 : 진행 중인 작업이 있으면 그 결과를, 없으면 새로 시작한 결과를 돌려주는 함수
*/
export const createSingleFlight = <TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
): ((...args: TArgs) => Promise<TResult>) => {
  let inFlight: Promise<TResult> | null = null;

  /*
  ??=는 왼쪽에 값이 있으면 오른쪽을 평가하지 않으므로 operation이 다시 호출되지 않는다.
  JavaScript는 단일 스레드라 검사와 대입 사이에 다른 호출이 끼어들 수 없다.

  나중 호출자가 넘긴 인자는 쓰이지 않는다. 먼저 시작한 작업의 인자로 얻은 결과를 함께 받는다.
  호출자마다 인자가 달라져야 하는 작업에는 쓸 수 없다.
  */
  return (...args: TArgs) => {
    inFlight ??= operation(...args).finally(() => {
      inFlight = null;
    });

    return inFlight;
  };
};
