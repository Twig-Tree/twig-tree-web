import { describe, it, expect } from "vitest";
import {
  MAX_WORKSPACE_NAME_LENGTH,
  type WorkspaceItem,
} from "@/src/entities/workspace";
import { validateWorkspaceName } from "./validateWorkspaceName";

const workspaces: WorkspaceItem[] = [
  { id: "1", name: "Research", updatedAt: "2026-08-31T21:00:00" },
  { id: "2", name: "재즈 역사", updatedAt: "2026-08-30T09:00:00" },
];

const validate = (name: string, workspaceId = "1") =>
  validateWorkspaceName({ workspaceId, workspaces, name });

const DUPLICATE_MESSAGE = "같은 위치에 동일한 이름의 워크스페이스가 있습니다.";

/*
길이 판정의 경계와 이모지 처리는 validateNameLength가 소유한다.
여기서는 워크스페이스 안내 문구를 쓰는지와 워크스페이스 고유 규칙인 이름 중복 검사만 확인한다.
*/
describe("validateWorkspaceName", () => {
  it("일반적인 이름은 통과시킨다", () => {
    expect(validate("새 워크스페이스")).toBeNull();
  });

  it("빈 입력을 워크스페이스 안내 문구로 거부한다", () => {
    expect(validate("   ")).toBe("워크스페이스 이름을 입력해 주세요.");
  });

  it("30자까지는 통과시킨다", () => {
    expect(validate("가".repeat(MAX_WORKSPACE_NAME_LENGTH))).toBeNull();
  });

  it("30자를 초과하면 워크스페이스 안내 문구로 거부한다", () => {
    expect(validate("가".repeat(MAX_WORKSPACE_NAME_LENGTH + 1))).toBe(
      "워크스페이스 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });

  it("같은 위치에 동일한 이름이 있으면 거부한다", () => {
    expect(validate("재즈 역사")).toBe(DUPLICATE_MESSAGE);
  });

  it("자기 자신의 이름은 중복으로 보지 않는다", () => {
    expect(validate("Research")).toBeNull();
  });

  it("앞뒤 공백을 제거한 뒤 중복을 판단한다", () => {
    expect(validate("  재즈 역사  ")).toBe(DUPLICATE_MESSAGE);
  });

  /*
  백엔드 unique 인덱스가 문자열을 그대로 비교하므로 대소문자만 다른 이름은 저장된다.
  프론트가 더 엄격하게 막으면 서버가 허용하는 이름을 입력할 수 없게 된다.
  */
  it("대소문자만 다른 이름은 중복으로 보지 않는다", () => {
    expect(validate("research", "2")).toBeNull();
  });
});
