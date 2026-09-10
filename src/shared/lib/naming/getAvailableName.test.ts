import { describe, it, expect } from "vitest";
import { getAvailableName } from "./getAvailableName";

describe("getAvailableName", () => {
  it("기본 이름이 비어 있으면 번호를 붙이지 않는다", () => {
    expect(getAvailableName("Folder", [])).toBe("Folder");
    expect(getAvailableName("Folder", ["Report", "Folder 2"])).toBe("Folder");
  });

  it("기본 이름이 이미 있으면 2부터 번호를 붙인다", () => {
    expect(getAvailableName("Folder", ["Folder"])).toBe("Folder 2");
    expect(getAvailableName("Folder", ["Folder", "Folder 2"])).toBe("Folder 3");
  });

  /*
  가장 작은 빈 번호를 쓴다. 마지막 번호 뒤에 이어 붙이면 삭제를 반복할수록 번호만 커진다.
  */
  it("중간 번호가 비어 있으면 그 번호를 쓴다", () => {
    expect(getAvailableName("Folder", ["Folder", "Folder 3"])).toBe("Folder 2");
    expect(getAvailableName("Folder", ["Folder", "Folder 2", "Folder 4"])).toBe(
      "Folder 3",
    );
  });

  it("도메인과 무관하게 같은 규칙으로 붙인다", () => {
    expect(getAvailableName("Workspace", ["Workspace"])).toBe("Workspace 2");
  });
});
