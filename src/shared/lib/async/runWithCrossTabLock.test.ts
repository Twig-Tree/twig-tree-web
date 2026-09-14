import { afterEach, describe, expect, it, vi } from "vitest";
import { runWithCrossTabLock } from "./runWithCrossTabLock";

/*
jsdom에는 Web Locks API가 없으므로 테스트가 navigator.locks를 직접 넣는다.
탭 사이의 실행 순서는 브라우저가 보장하므로 여기서는 검사하지 않는다.
*/
const setNavigatorLocks = (locks: unknown) => {
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: locks,
  });
};

// 테스트가 정의한 locks를 지워 jsdom의 원래 상태로 되돌린다.
afterEach(() => {
  Reflect.deleteProperty(navigator, "locks");
});

describe("runWithCrossTabLock", () => {
  it("락이 없는 환경에서는 바로 실행한다", async () => {
    await expect(
      runWithCrossTabLock("reissue", () => Promise.resolve("tokens")),
    ).resolves.toBe("tokens");
  });

  it("락이 있으면 같은 이름으로 request에 작업을 넘기고 결과를 돌려준다", async () => {
    // 실제 LockManager처럼 락을 준 뒤 콜백을 실행한다.
    const request = vi.fn((_name: string, callback: () => Promise<string>) =>
      callback(),
    );
    setNavigatorLocks({ request });

    await expect(
      runWithCrossTabLock("reissue", () => Promise.resolve("tokens")),
    ).resolves.toBe("tokens");
    expect(request).toHaveBeenCalledWith("reissue", expect.any(Function));
  });

  it("작업이 실패하면 같은 오류를 전달한다", async () => {
    const failure = new Error("reissue failed");

    await expect(
      runWithCrossTabLock("reissue", () => Promise.reject(failure)),
    ).rejects.toBe(failure);
  });
});
