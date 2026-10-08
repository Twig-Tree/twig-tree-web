import { describe, it, expect } from "vitest";
import { getExternalCollapsedServerIds } from "./getExternalCollapsedServerIds";
import { getCollapsedNodesStorageKey } from "./collapsedNodesStorage";

describe("getExternalCollapsedServerIds", () => {
  it("지금 열린 트리의 키가 바뀌면 다른 탭이 저장한 접힘 목록을 돌려준다", () => {
    expect(
      getExternalCollapsedServerIds({
        key: getCollapsedNodesStorageKey("5"),
        newValue: '["3","20"]',
        treeId: "5",
      }),
    ).toEqual(["3", "20"]);
  });

  it("다른 탭이 모두 펼쳐 빈 배열을 저장하면 빈 배열을 돌려준다", () => {
    expect(
      getExternalCollapsedServerIds({
        key: getCollapsedNodesStorageKey("5"),
        newValue: "[]",
        treeId: "5",
      }),
    ).toEqual([]);
  });

  it.each([
    [
      "다른 탭이 localStorage.clear()를 부른 경우",
      { key: null, newValue: null, treeId: "5" },
    ],
    [
      "다른 탭이 이 트리의 키를 지운 경우",
      { key: getCollapsedNodesStorageKey("5"), newValue: null, treeId: "5" },
    ],
    [
      "값을 접힘 목록으로 읽을 수 없는 경우",
      { key: getCollapsedNodesStorageKey("5"), newValue: "[3]", treeId: "5" },
    ],
    [
      "다른 트리의 키가 바뀐 경우",
      { key: getCollapsedNodesStorageKey("6"), newValue: '["3"]', treeId: "5" },
    ],
    [
      "접힘 상태를 아직 복원하지 않은 경우",
      {
        key: getCollapsedNodesStorageKey("5"),
        newValue: '["3"]',
        treeId: null,
      },
    ],
    [
      "접힘 목록과 관계없는 키가 바뀐 경우",
      { key: "other-key", newValue: '["3"]', treeId: "5" },
    ],
  ])("%s 무시하도록 null을 돌려준다", (_, params) => {
    expect(getExternalCollapsedServerIds(params)).toBeNull();
  });
});
