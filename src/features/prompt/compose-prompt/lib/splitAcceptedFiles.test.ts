import { describe, it, expect } from "vitest";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/src/entities/attachment";
import { splitAcceptedFiles } from "./splitAcceptedFiles";

const createFile = (name: string, type = "") => new File([], name, { type });

/*
File 생성자에 실제로 10MB를 담으면 테스트가 느려지므로 size만 원하는 값으로 바꾼다.
File.size는 읽기 전용이라 정의를 덮어써야 한다.
*/
const createFileOfSize = (name: string, sizeInBytes: number) => {
  const file = createFile(name);

  Object.defineProperty(file, "size", { value: sizeInBytes });

  return file;
};

describe("splitAcceptedFiles", () => {
  it("허용 확장자와 그렇지 않은 파일을 나눈다", () => {
    const { acceptedFiles, rejectedFiles } = splitAcceptedFiles([
      createFile("Solar_Efficiency_Report.pdf", "application/pdf"),
      createFile("shot.png", "image/png"),
      createFile("보고서.hwp"),
      createFile("data.xlsx"),
    ]);

    expect(acceptedFiles.map((file) => file.name)).toEqual([
      "Solar_Efficiency_Report.pdf",
      "보고서.hwp",
    ]);
    expect(rejectedFiles).toEqual([
      { name: "shot.png", reason: "extension" },
      { name: "data.xlsx", reason: "extension" },
    ]);
  });

  /*
  mimeType은 브라우저마다 달라서 판단 기준으로 쓰지 않는다.
  확장자가 허용 목록에 없으면 mimeType이 허용 형식이어도 거부해야 한다.
  */
  it("mimeType이 허용 형식이어도 확장자가 맞지 않으면 거부한다", () => {
    const { acceptedFiles, rejectedFiles } = splitAcceptedFiles([
      createFile("fake.png", "text/plain"),
    ]);

    expect(acceptedFiles).toHaveLength(0);
    expect(rejectedFiles).toEqual([{ name: "fake.png", reason: "extension" }]);
  });

  it("mimeType이 비어 있어도 확장자로 판단한다", () => {
    const { acceptedFiles } = splitAcceptedFiles([createFile("설계.hwpx")]);

    expect(acceptedFiles).toHaveLength(1);
  });

  it("상한과 같은 크기까지는 통과시킨다", () => {
    const { acceptedFiles, rejectedFiles } = splitAcceptedFiles([
      createFileOfSize("just_fit.pdf", MAX_ATTACHMENT_SIZE_BYTES),
    ]);

    expect(acceptedFiles).toHaveLength(1);
    expect(rejectedFiles).toEqual([]);
  });

  it("상한을 넘는 파일을 크기 사유로 거부한다", () => {
    const { acceptedFiles, rejectedFiles } = splitAcceptedFiles([
      createFileOfSize("too_big.pdf", MAX_ATTACHMENT_SIZE_BYTES + 1),
    ]);

    expect(acceptedFiles).toEqual([]);
    expect(rejectedFiles).toEqual([{ name: "too_big.pdf", reason: "size" }]);
  });

  /*
  크기를 줄여도 첨부할 수 없는 파일이므로 확장자를 먼저 알린다.
  */
  it("확장자와 크기가 모두 어긋나면 확장자 사유로 거부한다", () => {
    const { rejectedFiles } = splitAcceptedFiles([
      createFileOfSize("huge.png", MAX_ATTACHMENT_SIZE_BYTES + 1),
    ]);

    expect(rejectedFiles).toEqual([{ name: "huge.png", reason: "extension" }]);
  });

  it("사유가 다른 파일을 한 목록에 순서대로 담는다", () => {
    const { acceptedFiles, rejectedFiles } = splitAcceptedFiles([
      createFile("shot.png"),
      createFileOfSize("too_big.pdf", MAX_ATTACHMENT_SIZE_BYTES + 1),
      createFile("보고서.hwp"),
    ]);

    expect(acceptedFiles.map((file) => file.name)).toEqual(["보고서.hwp"]);
    expect(rejectedFiles).toEqual([
      { name: "shot.png", reason: "extension" },
      { name: "too_big.pdf", reason: "size" },
    ]);
  });

  it("빈 목록을 넘기면 양쪽 모두 비어 있다", () => {
    const { acceptedFiles, rejectedFiles } = splitAcceptedFiles([]);

    expect(acceptedFiles).toEqual([]);
    expect(rejectedFiles).toEqual([]);
  });
});
