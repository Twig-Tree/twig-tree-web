import { afterEach, describe, it, expect, vi } from "vitest";
import {
  getCollapsedNodesStorageKey,
  parseCollapsedServerIds,
  readCollapsedServerIds,
  writeCollapsedServerIds,
} from "./collapsedNodesStorage";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("parseCollapsedServerIds", () => {
  it("문자열 배열 JSON을 serverId 배열로 읽는다", () => {
    expect(parseCollapsedServerIds('["3","12"]')).toEqual(["3", "12"]);
  });

  it("빈 배열은 모두 펼친 상태이므로 null이 아니라 빈 배열로 읽는다", () => {
    expect(parseCollapsedServerIds("[]")).toEqual([]);
  });

  it.each([
    ["값이 없음", null],
    ["깨진 JSON", '["3"'],
    ["배열이 아닌 값", '{"3":true}'],
    ["문자열이 아닌 원소", "[3,12]"],
  ])("%s이면 null을 돌려준다", (_, value) => {
    expect(parseCollapsedServerIds(value)).toBeNull();
  });
});

describe("readCollapsedServerIds", () => {
  it("트리별 키에 저장된 접힘 목록을 읽는다", () => {
    window.localStorage.setItem(getCollapsedNodesStorageKey("5"), '["3","12"]');

    expect(readCollapsedServerIds("5")).toEqual(["3", "12"]);
    expect(readCollapsedServerIds("6")).toBeNull();
  });

  it("localStorage 접근이 예외를 던지면 null을 돌려준다", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    expect(readCollapsedServerIds("5")).toBeNull();
  });
});

describe("writeCollapsedServerIds", () => {
  it("접힘 목록을 트리별 키에 JSON 배열로 저장한다", () => {
    writeCollapsedServerIds("5", new Set(["3", "12"]));

    expect(window.localStorage.getItem(getCollapsedNodesStorageKey("5"))).toBe(
      '["3","12"]',
    );
  });

  it("localStorage 저장이 예외를 던져도 호출부로 전파하지 않는다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(() => writeCollapsedServerIds("5", ["3"])).not.toThrow();
  });
});
