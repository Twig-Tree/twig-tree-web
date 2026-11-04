import { afterEach, describe, it, expect } from "vitest";
import {
  type AddNodeEntry,
  type MoveNodeEntry,
  useEditHistoryStore,
} from "./editHistoryStore";

const createAddEntry = (clientId: string): AddNodeEntry => ({
  type: "add",
  clientId,
  parentClientId: "root",
  label: clientId,
});

const createMoveEntry = (clientId: string): MoveNodeEntry => ({
  type: "move",
  clientId,
  from: { parentClientId: "root", position: 1 },
  to: { parentClientId: "root", position: 2 },
});

const getHistory = () => {
  const { past, future } = useEditHistoryStore.getState();

  return { past, future };
};

describe("useEditHistoryStore", () => {
  afterEach(() => {
    useEditHistoryStore.getState().clear();
  });

  it("undo와 redo는 기록을 반대편으로 옮기고 그 기록을 돌려준다", () => {
    const first = createAddEntry("a");
    const second = createMoveEntry("b");
    const { record, takeUndo, takeRedo } = useEditHistoryStore.getState();

    record(first);
    record(second);

    expect(takeUndo()).toBe(second);
    expect(getHistory()).toEqual({ past: [first], future: [second] });

    expect(takeUndo()).toBe(first);
    expect(getHistory()).toEqual({ past: [], future: [second, first] });

    expect(takeRedo()).toBe(first);
    expect(getHistory()).toEqual({ past: [first], future: [second] });
  });

  it("꺼낼 기록이 없으면 null을 돌려주고 스택을 바꾸지 않는다", () => {
    const { takeUndo, takeRedo } = useEditHistoryStore.getState();

    expect(takeUndo()).toBeNull();
    expect(takeRedo()).toBeNull();
    expect(getHistory()).toEqual({ past: [], future: [] });
  });

  it("새 편집을 기록하면 redo 기록을 비운다", () => {
    const first = createAddEntry("a");
    const second = createAddEntry("b");
    const { record, takeUndo } = useEditHistoryStore.getState();

    record(first);
    takeUndo();
    record(second);

    expect(getHistory()).toEqual({ past: [second], future: [] });
  });

  it("undo가 실패하면 꺼내기 전 스택으로 돌아간다", () => {
    const first = createAddEntry("a");
    const second = createAddEntry("b");
    const third = createAddEntry("c");
    const { record, takeUndo, takeRedo, cancelUndo } =
      useEditHistoryStore.getState();

    record(first);
    record(second);
    record(third);
    takeUndo();
    const before = getHistory(); // past [first, second], future [third]

    const entry = takeUndo()!;
    cancelUndo(entry);

    expect(entry).toBe(second);
    expect(getHistory()).toEqual(before);
    expect(takeRedo()).toBe(third);
  });

  it("redo가 실패하면 꺼내기 전 스택으로 돌아간다", () => {
    const first = createAddEntry("a");
    const second = createAddEntry("b");
    const { record, takeUndo, takeRedo, cancelRedo } =
      useEditHistoryStore.getState();

    record(first);
    record(second);
    takeUndo();
    takeUndo();
    const before = getHistory(); // past [], future [second, first]

    const entry = takeRedo()!;
    cancelRedo(entry);

    expect(entry).toBe(first);
    expect(getHistory()).toEqual(before);
  });

  it("요청 중 기록이 비워졌으면 실패해도 돌려놓지 않는다", () => {
    const { record, takeUndo, cancelUndo, clear } =
      useEditHistoryStore.getState();

    record(createAddEntry("a"));
    const entry = takeUndo()!;
    clear();
    cancelUndo(entry);

    expect(getHistory()).toEqual({ past: [], future: [] });
  });
});
