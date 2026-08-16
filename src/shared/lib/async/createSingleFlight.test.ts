import { describe, it, expect } from "vitest";
import { createSingleFlight } from "./createSingleFlight";

// 작업이 끝나는 시점을 테스트가 직접 정하기 위해 밖에서 결정할 수 있는 promise를 만든다.
const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

describe("createSingleFlight", () => {
  it("진행 중인 작업이 있으면 다시 실행하지 않는다", async () => {
    const deferred = createDeferred<string>();
    let callCount = 0;

    const run = createSingleFlight(() => {
      callCount += 1;
      return deferred.promise;
    });

    const first = run();
    const second = run();
    const third = run();

    expect(callCount).toBe(1);

    deferred.resolve("tokens");

    await expect(first).resolves.toBe("tokens");
    await expect(second).resolves.toBe("tokens");
    await expect(third).resolves.toBe("tokens");
  });

  it("작업이 끝나면 다음 호출은 새로 실행한다", async () => {
    let callCount = 0;

    const run = createSingleFlight(() => {
      callCount += 1;
      return Promise.resolve(callCount);
    });

    await expect(run()).resolves.toBe(1);
    await expect(run()).resolves.toBe(2);
    expect(callCount).toBe(2);
  });

  it("실패하면 대기 중인 호출자 모두 같은 오류를 받는다", async () => {
    const deferred = createDeferred<string>();
    const run = createSingleFlight(() => deferred.promise);
    const failure = new Error("reissue failed");

    const first = run();
    const second = run();

    // reject보다 먼저 기대를 붙여 처리되지 않은 rejection이 남지 않게 한다.
    const firstAssertion = expect(first).rejects.toBe(failure);
    const secondAssertion = expect(second).rejects.toBe(failure);

    deferred.reject(failure);

    await firstAssertion;
    await secondAssertion;
  });

  /*
  실패했을 때도 진행 중 표시를 지워야 한다.
  지우지 않으면 이후 모든 호출이 같은 실패한 promise를 돌려받아 재발급이 영구히 막힌다.
  */
  it("실패한 뒤에도 다음 호출은 새로 실행한다", async () => {
    let callCount = 0;

    const run = createSingleFlight(() => {
      callCount += 1;

      return callCount === 1
        ? Promise.reject(new Error("첫 시도 실패"))
        : Promise.resolve("tokens");
    });

    await expect(run()).rejects.toThrow("첫 시도 실패");
    await expect(run()).resolves.toBe("tokens");
    expect(callCount).toBe(2);
  });

  it("진행 중일 때 나중 호출자가 넘긴 인자는 쓰이지 않는다", async () => {
    const deferred = createDeferred<string>();
    const receivedArgs: string[] = [];

    const run = createSingleFlight((refreshToken: string) => {
      receivedArgs.push(refreshToken);
      return deferred.promise;
    });

    const first = run("먼저 시작한 토큰");
    const second = run("나중에 넘긴 토큰");

    deferred.resolve("tokens");
    await Promise.all([first, second]);

    expect(receivedArgs).toEqual(["먼저 시작한 토큰"]);
  });
});
