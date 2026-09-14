import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/src/entities/attachment";
import { createFile, createFileOfSize } from "@/src/tests/helpers/createFile";
import { useComposePrompt } from "./useComposePrompt";

/*
isSubmitting을 바꿔 가며 확인해야 하므로 rerender에 넘길 props 형태로 렌더한다.
onSubmit은 호출 여부와 인자를 확인해야 해서 함께 돌려준다.
*/
const renderComposePrompt = (isSubmitting = false) => {
  const onSubmit = vi.fn();

  const view = renderHook(
    (props: { isSubmitting: boolean }) =>
      useComposePrompt({ isSubmitting: props.isSubmitting, onSubmit }),
    { initialProps: { isSubmitting } },
  );

  return { ...view, onSubmit };
};

describe("useComposePrompt", () => {
  it("허용 파일을 두 개 넘겨도 첨부는 하나만 남는다", () => {
    const { result } = renderComposePrompt();

    act(() =>
      result.current.addFiles([
        createFile("보고서.hwp"),
        createFile("요약.pdf"),
      ]),
    );

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].name).toBe("보고서.hwp");
  });

  it("첨부가 하나면 isAttachDisabled가 true다", () => {
    const { result } = renderComposePrompt();

    expect(result.current.isAttachDisabled).toBe(false);

    act(() => result.current.addFiles([createFile("보고서.hwp")]));

    expect(result.current.isAttachDisabled).toBe(true);
  });

  /*
  화면에서는 첨부 버튼이 잠겨 여기까지 오지 않지만, 드래그 앤 드롭처럼 다른 경로가
  생겨도 개수 제약이 깨지지 않아야 한다.
  */
  it("첨부가 있는 상태에서 파일을 더 넘겨도 개수가 늘지 않는다", () => {
    const { result } = renderComposePrompt();

    act(() => result.current.addFiles([createFile("보고서.hwp")]));
    act(() => result.current.addFiles([createFile("요약.pdf")]));

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].name).toBe("보고서.hwp");
  });

  it("거부된 파일이 사유와 함께 rejectedFiles에 남는다", () => {
    const { result } = renderComposePrompt();

    act(() =>
      result.current.addFiles([
        createFile("shot.png"),
        createFileOfSize("too_big.pdf", MAX_ATTACHMENT_SIZE_BYTES + 1),
      ]),
    );

    expect(result.current.attachments).toEqual([]);
    expect(result.current.rejectedFiles).toEqual([
      { name: "shot.png", reason: "extension" },
      { name: "too_big.pdf", reason: "size" },
    ]);
  });

  it("파일을 다시 고르면 이전 거부 안내가 새 목록으로 교체된다", () => {
    const { result } = renderComposePrompt();

    act(() => result.current.addFiles([createFile("shot.png")]));
    act(() => result.current.addFiles([createFile("data.xlsx")]));

    expect(result.current.rejectedFiles).toEqual([
      { name: "data.xlsx", reason: "extension" },
    ]);
  });

  it("허용 파일만 고르면 이전 거부 안내가 비워진다", () => {
    const { result } = renderComposePrompt();

    act(() => result.current.addFiles([createFile("shot.png")]));
    act(() => result.current.addFiles([createFile("보고서.hwp")]));

    expect(result.current.rejectedFiles).toEqual([]);
  });

  it("dismissRejection이 안내를 비운다", () => {
    const { result } = renderComposePrompt();

    act(() => result.current.addFiles([createFile("shot.png")]));
    expect(result.current.rejectedFiles).toHaveLength(1);

    act(() => result.current.dismissRejection());

    expect(result.current.rejectedFiles).toEqual([]);
  });

  it("공백만 입력하면 isSubmitDisabled가 true다", () => {
    const { result } = renderComposePrompt();

    expect(result.current.isSubmitDisabled).toBe(true);

    act(() => result.current.setText("   "));
    expect(result.current.isSubmitDisabled).toBe(true);

    act(() => result.current.setText("연구 요약"));
    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it("isSubmitting이 true면 입력이 있어도 잠긴다", () => {
    const { result, rerender } = renderComposePrompt();

    act(() => result.current.setText("연구 요약"));
    expect(result.current.isSubmitDisabled).toBe(false);

    rerender({ isSubmitting: true });

    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it("submitPrompt가 trim한 text와 첨부를 onSubmit에 넘긴다", () => {
    const { result, onSubmit } = renderComposePrompt();

    act(() => {
      result.current.setText("  연구 요약  ");
      result.current.addFiles([createFile("보고서.hwp")]);
    });

    const attachments = result.current.attachments; // 비워지기 전의 목록을 남겨 둔다

    act(() => result.current.submitPrompt());

    expect(onSubmit).toHaveBeenCalledWith({ attachments, text: "연구 요약" });
  });

  it("전송 후 text·attachments·rejectedFiles가 모두 비워진다", () => {
    const { result } = renderComposePrompt();

    act(() => {
      result.current.setText("연구 요약");
      result.current.addFiles([
        createFile("보고서.hwp"),
        createFile("shot.png"),
      ]);
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.rejectedFiles).toHaveLength(1);

    act(() => result.current.submitPrompt());

    expect(result.current.text).toBe("");
    expect(result.current.attachments).toEqual([]);
    expect(result.current.rejectedFiles).toEqual([]);
  });

  it("잠긴 상태에서 submitPrompt를 불러도 onSubmit이 호출되지 않는다", () => {
    const { result, rerender, onSubmit } = renderComposePrompt();

    act(() => result.current.submitPrompt()); // 입력이 비어 있다
    expect(onSubmit).not.toHaveBeenCalled();

    act(() => result.current.setText("연구 요약"));
    rerender({ isSubmitting: true }); // 상위 요청이 진행 중이다

    act(() => result.current.submitPrompt());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
