import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { useCollapseStore } from "./collapseStore";
import { useSyncCollapseAcrossTabs } from "./useSyncCollapseAcrossTabs";
import { getCollapsedNodesStorageKey } from "../../lib/collapse/collapsedNodesStorage";

/*
다른 탭이 localStorage를 바꾼 상황을 storage 이벤트로 흉내 낸다.
*/
const dispatchStorageEvent = (key: string | null, newValue: string | null) =>
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  });

const getCollapsedServerIds = () =>
  Array.from(useCollapseStore.getState().collapsedServerIds);

beforeEach(() => {
  useCollapseStore.setState({
    treeId: "5",
    collapsedServerIds: new Set(["s2"]),
  });
});

afterEach(() => {
  useCollapseStore.getState().resetCollapse();
});

describe("useSyncCollapseAcrossTabs", () => {
  it("다른 탭이 같은 트리의 접힘 목록을 저장하면 이 탭의 접힘 집합을 교체한다", () => {
    renderHook(() => useSyncCollapseAcrossTabs());

    dispatchStorageEvent(getCollapsedNodesStorageKey("5"), '["s3","s20"]');

    expect(getCollapsedServerIds()).toEqual(["s3", "s20"]);
  });

  it("다른 트리의 키가 바뀌면 이 탭의 접힘 집합을 그대로 둔다", () => {
    renderHook(() => useSyncCollapseAcrossTabs());

    dispatchStorageEvent(getCollapsedNodesStorageKey("6"), '["s3"]');

    expect(getCollapsedServerIds()).toEqual(["s2"]);
  });

  it("언마운트한 뒤에는 storage 이벤트를 받지 않는다", () => {
    const { unmount } = renderHook(() => useSyncCollapseAcrossTabs());

    unmount();
    dispatchStorageEvent(getCollapsedNodesStorageKey("5"), '["s3"]');

    expect(getCollapsedServerIds()).toEqual(["s2"]);
  });
});
