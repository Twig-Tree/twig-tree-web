import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MAX_DOCUMENT_ATTACHMENT_SIZE_BYTES } from "@/src/entities/attachment";
import { MAX_PROMPT_MESSAGE_LENGTH } from "@/src/entities/tree";
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

  /*
  응답을 1분 가까이 기다리는 동안 첨부를 더할 수 있으면, 그 파일은 이미 나간 요청에 실리지
  않는데도 성공해서 입력을 비울 때 함께 지워진다.
  */
  it("생성 중에는 첨부를 잠그고 파일도 받지 않는다", () => {
    const { result } = renderComposePrompt(true);

    expect(result.current.isAttachDisabled).toBe(true);
    expect(result.current.attachDisabledReason).toBe(
      "트리를 만드는 동안에는 첨부를 바꿀 수 없습니다.",
    );

    act(() => result.current.addFiles([createFile("보고서.hwp")]));

    expect(result.current.attachments).toHaveLength(0);
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
        createFileOfSize("too_big.pdf", MAX_DOCUMENT_ATTACHMENT_SIZE_BYTES + 1),
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

  /*
  백엔드도 지시문과 파일이 모두 비었을 때만 거절한다. 문서만 올리고 지시문을 생략하는 흐름을 막지 않는다.
  */
  it("지시문이 없어도 첨부가 있으면 전송할 수 있다", () => {
    const { result } = renderComposePrompt();

    expect(result.current.isSubmitDisabled).toBe(true);

    act(() => result.current.addFiles([createFile("보고서.hwp")]));

    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it("isSubmitting이 true면 입력이 있어도 잠긴다", () => {
    const { result, rerender } = renderComposePrompt();

    act(() => result.current.setText("연구 요약"));
    expect(result.current.isSubmitDisabled).toBe(false);

    rerender({ isSubmitting: true });

    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it("submitPrompt가 trim한 text와 첨부를 onSubmit에 넘긴다", async () => {
    const { result, onSubmit } = renderComposePrompt();

    act(() => {
      result.current.setText("  연구 요약  ");
      result.current.addFiles([createFile("보고서.hwp")]);
    });

    const attachments = result.current.attachments; // 비워지기 전의 목록을 남겨 둔다

    await act(() => result.current.submitPrompt());

    expect(onSubmit).toHaveBeenCalledWith({ attachments, text: "연구 요약" });
  });

  it("전송 후 text·attachments·rejectedFiles가 모두 비워진다", async () => {
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

    await act(() => result.current.submitPrompt());

    expect(result.current.text).toBe("");
    expect(result.current.attachments).toEqual([]);
    expect(result.current.rejectedFiles).toEqual([]);
  });

  it("잠긴 상태에서 submitPrompt를 불러도 onSubmit이 호출되지 않는다", async () => {
    const { result, rerender, onSubmit } = renderComposePrompt();

    await act(() => result.current.submitPrompt()); // 입력이 비어 있다
    expect(onSubmit).not.toHaveBeenCalled();

    act(() => result.current.setText("연구 요약"));
    rerender({ isSubmitting: true }); // 상위 요청이 진행 중이다

    await act(() => result.current.submitPrompt());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  /*
  트리 생성은 응답까지 1분 가까이 걸릴 수 있다. 그 끝에 실패했는데 입력까지 비우면
  지시문과 첨부를 처음부터 다시 만들어야 한다.
  */
  it("onSubmit이 실패하면 입력을 비우지 않는다", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("생성 실패"));
    const { result } = renderHook(() =>
      useComposePrompt({ isSubmitting: false, onSubmit }),
    );

    act(() => {
      result.current.setText("연구 요약");
      result.current.addFiles([createFile("보고서.hwp")]);
    });

    await act(() => result.current.submitPrompt());

    expect(result.current.text).toBe("연구 요약");
    expect(result.current.attachments).toHaveLength(1);
  });

  it("onSubmit이 성공하면 입력을 비운다", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useComposePrompt({ isSubmitting: false, onSubmit }),
    );

    act(() => result.current.setText("연구 요약"));

    await act(() => result.current.submitPrompt());

    expect(result.current.text).toBe("");
  });

  /*
  백엔드가 500자를 넘는 지시문을 거절하므로 기다리기 전에 막는다.
  */
  it("지시문이 500자를 넘으면 전송이 잠기고 안내 상태가 켜진다", () => {
    const { result } = renderComposePrompt();

    act(() => result.current.setText("가".repeat(MAX_PROMPT_MESSAGE_LENGTH)));

    expect(result.current.isMessageTooLong).toBe(false);
    expect(result.current.isSubmitDisabled).toBe(false);

    act(() =>
      result.current.setText("가".repeat(MAX_PROMPT_MESSAGE_LENGTH + 1)),
    );

    expect(result.current.isMessageTooLong).toBe(true);
    expect(result.current.isSubmitDisabled).toBe(true);
  });

  /*
  서버에도 앞뒤 공백을 지운 값을 보내므로 같은 값으로 길이를 센다.
  */
  it("앞뒤 공백은 길이에서 빼고 센다", () => {
    const { result } = renderComposePrompt();

    act(() =>
      result.current.setText(`  ${"가".repeat(MAX_PROMPT_MESSAGE_LENGTH)}  `),
    );

    expect(result.current.isMessageTooLong).toBe(false);
  });
});
