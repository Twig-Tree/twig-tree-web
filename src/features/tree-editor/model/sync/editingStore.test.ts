import { afterEach, describe, expect, it } from "vitest";
import { useEditingStore } from "./editingStore";

const getNameEditors = () => useEditingStore.getState().nameEditors;

describe("editingStore 이름 입력창 기록", () => {
  afterEach(() => {
    useEditingStore.setState({ nameEditors: new Map() });
  });

  it("노드마다 입력창이 열린 곳을 기록하고, 닫으면 지운다", () => {
    const { startNodeNameEditing, endNodeNameEditing } =
      useEditingStore.getState();

    startNodeNameEditing("c1", "canvas");
    startNodeNameEditing("c2", "panel");

    expect(getNameEditors().get("c1")).toBe("canvas");
    expect(getNameEditors().get("c2")).toBe("panel");

    endNodeNameEditing("c1", "canvas");

    expect(getNameEditors().has("c1")).toBe(false);
    expect(getNameEditors().get("c2")).toBe("panel");
  });

  /*
  한 노드에는 입력창을 하나만 연다. 먼저 연 곳의 기록을 덮으면 그 입력창이 닫힐 때 기록이 남지 않는다.
  */
  it("다른 곳에서 이미 연 노드는 기록을 바꾸지 않는다", () => {
    const { startNodeNameEditing } = useEditingStore.getState();

    startNodeNameEditing("c1", "canvas");
    startNodeNameEditing("c1", "panel");

    expect(getNameEditors().get("c1")).toBe("canvas");
  });

  /*
  다른 곳의 기록을 지우면 아직 입력 중인 그 입력창을 다른 곳의 변경이 덮어쓸 수 있다.
  */
  it("자기가 연 기록만 지운다", () => {
    const { startNodeNameEditing, endNodeNameEditing } =
      useEditingStore.getState();

    startNodeNameEditing("c1", "canvas");
    endNodeNameEditing("c1", "panel");

    expect(getNameEditors().get("c1")).toBe("canvas");
  });
});
