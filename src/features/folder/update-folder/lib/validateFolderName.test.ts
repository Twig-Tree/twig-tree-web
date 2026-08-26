import { describe, it, expect } from "vitest";
import type { FolderItem } from "@/src/entities/folder";
import { MAX_FOLDER_NAME_LENGTH } from "@/src/entities/folder/model/constants";
import { validateFolderName } from "./validateFolderName";

const folders: FolderItem[] = [
  { id: "1", name: "고전 음악" },
  { id: "2", name: "재즈" },
];

const validate = (name: string, folderId = "1") =>
  validateFolderName({ folderId, folders, name });

/*
길이 판정의 경계와 이모지 처리는 validateNameLength가 소유한다.
여기서는 폴더 안내 문구를 쓰는지와 폴더 고유 규칙인 이름 중복 검사만 확인한다.
*/
describe("validateFolderName", () => {
  it("일반적인 이름은 통과시킨다", () => {
    expect(validate("새 폴더")).toBeNull();
  });

  it("빈 입력을 폴더 안내 문구로 거부한다", () => {
    expect(validate("   ")).toBe("폴더 이름을 입력해 주세요.");
  });

  it("30자까지는 통과시킨다", () => {
    expect(validate("가".repeat(MAX_FOLDER_NAME_LENGTH))).toBeNull();
  });

  it("30자를 초과하면 폴더 안내 문구로 거부한다", () => {
    expect(validate("가".repeat(MAX_FOLDER_NAME_LENGTH + 1))).toBe(
      "폴더 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });

  /*
  이전 기준은 40바이트였다. 한글 30자는 UTF-8로 90바이트라 그때는 거부되던 입력이다.
  한영 동일 30자 정책이 적용되었는지 확인한다.
  */
  it("한글과 영문을 같은 글자 수로 센다", () => {
    expect(validate("가".repeat(MAX_FOLDER_NAME_LENGTH))).toBeNull();
    expect(validate("a".repeat(MAX_FOLDER_NAME_LENGTH))).toBeNull();
  });

  it("같은 위치에 동일한 이름이 있으면 거부한다", () => {
    expect(validate("재즈")).toBe("같은 위치에 동일한 이름의 폴더가 있습니다.");
  });

  it("자기 자신의 이름은 중복으로 보지 않는다", () => {
    expect(validate("고전 음악")).toBeNull();
  });

  it("앞뒤 공백을 제거한 뒤 중복을 판단한다", () => {
    expect(validate("  재즈  ")).toBe(
      "같은 위치에 동일한 이름의 폴더가 있습니다.",
    );
  });
});
