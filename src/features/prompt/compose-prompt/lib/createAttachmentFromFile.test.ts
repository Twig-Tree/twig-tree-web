import { describe, it, expect } from "vitest";
import { createAttachmentFromFile } from "./createAttachmentFromFile";

describe("createAttachmentFromFile", () => {
  it("File의 이름, 크기, mimeType을 첨부 모델로 옮긴다", () => {
    const file = new File(["a".repeat(2048)], "보고서.hwp", {
      type: "application/x-hwp",
    });

    const attachment = createAttachmentFromFile(file);

    expect(attachment.name).toBe("보고서.hwp");
    expect(attachment.sizeInBytes).toBe(2048);
    expect(attachment.mimeType).toBe("application/x-hwp");
  });

  it("브라우저가 판별하지 못한 mimeType은 빈 문자열로 유지한다", () => {
    const attachment = createAttachmentFromFile(new File([], "설계.hwpx"));

    expect(attachment.mimeType).toBe("");
  });

  /*
  같은 파일을 두 번 첨부해도 목록에서 각각을 구분할 수 있어야 하므로 id가 겹치면 안 된다.
  */
  it("호출할 때마다 서로 다른 id를 만든다", () => {
    const file = new File([], "a.pdf", { type: "application/pdf" });

    const first = createAttachmentFromFile(file);
    const second = createAttachmentFromFile(file);

    expect(first.id).not.toBe(second.id);
  });
});
