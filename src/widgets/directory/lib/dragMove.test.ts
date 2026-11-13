import { describe, expect, it } from "vitest";
import {
  getDragMoveItemId,
  getDragMoveTargetId,
  isDroppableTarget,
  type DragMoveItem,
} from "./dragMove";

const folderItem: DragMoveItem = {
  kind: "folder",
  folder: { id: "1", name: "기획" },
};

const workspaceItem = (folderId: string | null): DragMoveItem => ({
  kind: "workspace",
  workspace: {
    id: "1",
    name: "리서치",
    folderId,
    updatedAt: "2026-08-31T12:00:00.000000Z",
  },
});

describe("isDroppableTarget", () => {
  it("폴더를 다른 형제 폴더에 놓을 수 있다", () => {
    expect(isDroppableTarget(folderItem, "2", null)).toBe(true);
  });

  it("폴더를 자기 자신 위에는 놓을 수 없다", () => {
    expect(isDroppableTarget(folderItem, "1", null)).toBe(false);
  });

  it("폴더를 지금 들어 있는 디렉토리에는 놓을 수 없다", () => {
    expect(isDroppableTarget(folderItem, "5", "5")).toBe(false);
    expect(isDroppableTarget(folderItem, null, null)).toBe(false);
  });

  it("하위 디렉토리의 폴더를 루트로 옮길 수 있다", () => {
    expect(isDroppableTarget(folderItem, null, "5")).toBe(true);
  });

  it("워크스페이스는 자기 folderId로 지금 위치를 판단한다", () => {
    expect(isDroppableTarget(workspaceItem("3"), "3", null)).toBe(false);
    expect(isDroppableTarget(workspaceItem("3"), null, null)).toBe(true);
  });

  it("워크스페이스는 ID가 같은 폴더에도 놓을 수 있다", () => {
    expect(isDroppableTarget(workspaceItem(null), "1", null)).toBe(true);
  });
});

describe("dnd-kit ID", () => {
  it("ID가 같은 폴더와 워크스페이스를 구분한다", () => {
    expect(getDragMoveItemId(folderItem)).not.toBe(
      getDragMoveItemId(workspaceItem(null)),
    );
  });

  it("루트와 폴더, 놓는 자리를 구분한다", () => {
    expect(getDragMoveTargetId("card", null)).toBe("card:root");
    expect(getDragMoveTargetId("card", "1")).not.toBe(
      getDragMoveTargetId("breadcrumb", "1"),
    );
  });
});
