import { afterEach, describe, it, expect } from "vitest";
import { useTreeTagStore } from "./treeTagStore";

describe("treeTagStore", () => {
  afterEach(() => {
    useTreeTagStore.getState().resetTags();
  });

  it("addTag는 만든 순서대로 태그를 더한다", () => {
    const { addTag } = useTreeTagStore.getState();

    addTag({ id: "t1", name: "React" });
    addTag({ id: "t2", name: "중요" });

    expect(useTreeTagStore.getState().tags).toEqual([
      { id: "t1", name: "React" },
      { id: "t2", name: "중요" },
    ]);
  });

  it("deleteTag는 그 태그만 뺀다", () => {
    const { addTag, deleteTag } = useTreeTagStore.getState();

    addTag({ id: "t1", name: "React" });
    addTag({ id: "t2", name: "중요" });
    deleteTag("t1");

    expect(useTreeTagStore.getState().tags).toEqual([
      { id: "t2", name: "중요" },
    ]);
  });

  it("resetTags는 목록을 비운다", () => {
    const { addTag, resetTags } = useTreeTagStore.getState();

    addTag({ id: "t1", name: "React" });
    resetTags();

    expect(useTreeTagStore.getState().tags).toEqual([]);
  });
});
