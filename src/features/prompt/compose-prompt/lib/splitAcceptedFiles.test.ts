import { describe, it, expect } from "vitest";
import { splitAcceptedFiles } from "./splitAcceptedFiles";

const createFile = (name: string, type = "") => new File([], name, { type });

describe("splitAcceptedFiles", () => {
  it("허용 확장자와 그렇지 않은 파일을 나눈다", () => {
    const { acceptedFiles, rejectedFileNames } = splitAcceptedFiles([
      createFile("Solar_Efficiency_Report.pdf", "application/pdf"),
      createFile("shot.png", "image/png"),
      createFile("보고서.hwp"),
      createFile("data.xlsx"),
    ]);

    expect(acceptedFiles.map((file) => file.name)).toEqual([
      "Solar_Efficiency_Report.pdf",
      "보고서.hwp",
    ]);
    expect(rejectedFileNames).toEqual(["shot.png", "data.xlsx"]);
  });

  /*
  mimeType은 브라우저마다 달라서 판단 기준으로 쓰지 않는다.
  확장자가 허용 목록에 없으면 mimeType이 허용 형식이어도 거부해야 한다.
  */
  it("mimeType이 허용 형식이어도 확장자가 맞지 않으면 거부한다", () => {
    const { acceptedFiles, rejectedFileNames } = splitAcceptedFiles([
      createFile("fake.png", "text/plain"),
    ]);

    expect(acceptedFiles).toHaveLength(0);
    expect(rejectedFileNames).toEqual(["fake.png"]);
  });

  it("mimeType이 비어 있어도 확장자로 판단한다", () => {
    const { acceptedFiles } = splitAcceptedFiles([createFile("설계.hwpx")]);

    expect(acceptedFiles).toHaveLength(1);
  });

  it("모두 거부되면 허용 목록이 비어 있다", () => {
    const { acceptedFiles, rejectedFileNames } = splitAcceptedFiles([
      createFile("a.png"),
      createFile("b.zip"),
    ]);

    expect(acceptedFiles).toEqual([]);
    expect(rejectedFileNames).toEqual(["a.png", "b.zip"]);
  });

  it("빈 목록을 넘기면 양쪽 모두 비어 있다", () => {
    const { acceptedFiles, rejectedFileNames } = splitAcceptedFiles([]);

    expect(acceptedFiles).toEqual([]);
    expect(rejectedFileNames).toEqual([]);
  });
});
