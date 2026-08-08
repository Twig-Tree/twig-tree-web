import { describe, it, expect } from "vitest";
import { getFileKind, isAcceptedFileName } from "./getFileKind";

describe("getFileKind", () => {
  it("허용 확장자를 표시 분류로 변환한다", () => {
    expect(getFileKind("notes.txt")).toBe("text");
    expect(getFileKind("notes.md")).toBe("text");
    expect(getFileKind("Solar_Efficiency_Report.pdf")).toBe("pdf");
    expect(getFileKind("report.docx")).toBe("word");
    expect(getFileKind("보고서.hwp")).toBe("hwp");
    expect(getFileKind("설계.hwpx")).toBe("hwp");
  });

  it("확장자의 대소문자를 구분하지 않는다", () => {
    expect(getFileKind("논문.HWP")).toBe("hwp");
    expect(getFileKind("REPORT.PDF")).toBe("pdf");
  });

  it("허용 목록에 없는 확장자는 unknown으로 처리한다", () => {
    expect(getFileKind("shot.png")).toBe("unknown");
    expect(getFileKind("data.xlsx")).toBe("unknown");
  });

  it("마지막 점 뒤를 확장자로 본다", () => {
    expect(getFileKind("report.final.pdf")).toBe("pdf");
    expect(getFileKind("archive.pdf.zip")).toBe("unknown");
  });

  it("확장자가 없는 이름은 unknown으로 처리한다", () => {
    expect(getFileKind("README")).toBe("unknown");
  });

  it("점으로 시작하는 이름은 확장자로 보지 않는다", () => {
    expect(getFileKind(".gitignore")).toBe("unknown");
    expect(getFileKind(".pdf")).toBe("unknown");
  });
});

describe("isAcceptedFileName", () => {
  it("허용 확장자는 첨부할 수 있다", () => {
    expect(isAcceptedFileName("보고서.hwp")).toBe(true);
    expect(isAcceptedFileName("report.docx")).toBe(true);
  });

  it("허용하지 않는 확장자는 첨부할 수 없다", () => {
    expect(isAcceptedFileName("shot.png")).toBe(false);
    expect(isAcceptedFileName("README")).toBe(false);
  });
});
