import { describe, expect, it } from "vitest";
import { runNodeSaveInOrder } from "./runNodeSaveInOrder";

/*
함수 이름 : createDeferred
기능 : 테스트가 끝나는 시점을 직접 정할 수 있는 Promise를 만든다.
인자 : 없음
반환값 : Promise와 그 resolve·reject 함수
*/
const createDeferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve));

describe("runNodeSaveInOrder", () => {
  it("같은 노드의 저장은 앞 저장이 끝난 뒤에 시작한다", async () => {
    const first = createDeferred();
    const startedSaves: string[] = [];

    const firstSave = runNodeSaveInOrder("c1", () => {
      startedSaves.push("first");
      return first.promise;
    });
    const secondSave = runNodeSaveInOrder("c1", async () => {
      startedSaves.push("second");
    });

    await flushPromises();
    expect(startedSaves).toEqual(["first"]);

    first.resolve();
    await Promise.all([firstSave, secondSave]);

    expect(startedSaves).toEqual(["first", "second"]);
  });

  it("앞 저장이 실패해도 다음 저장을 실행하고, 실패는 그 호출에만 돌려준다", async () => {
    const first = createDeferred();

    const firstSave = runNodeSaveInOrder("c2", () => first.promise);
    const secondSave = runNodeSaveInOrder("c2", async () => "saved");

    first.reject(new Error("failed"));

    await expect(firstSave).rejects.toThrow("failed");
    await expect(secondSave).resolves.toBe("saved");
  });

  it("다른 노드의 저장은 기다리지 않는다", async () => {
    const first = createDeferred();
    let hasOtherNodeSaved = false;

    const firstSave = runNodeSaveInOrder("c3", () => first.promise);

    await runNodeSaveInOrder("c4", async () => {
      hasOtherNodeSaved = true;
    });

    expect(hasOtherNodeSaved).toBe(true);

    first.resolve();
    await firstSave;
  });
});
