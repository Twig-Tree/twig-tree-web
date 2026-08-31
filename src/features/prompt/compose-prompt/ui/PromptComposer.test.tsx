import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/src/entities/attachment";
import { createFile, createFileOfSize } from "@/src/tests/helpers/createFile";
import { PromptComposer } from "./PromptComposer";

/*
파일 입력은 display:none이라 접근성 트리에 없고 label도 없어 role로 찾을 수 없다.
PromptComposer 안에 파일 입력은 하나뿐이므로 셀렉터로 잡는다. 나머지 요소는 모두
접근성 이름으로 찾는다.

applyAccept는 upload()의 인자가 아니라 setup()의 옵션이라 여기서 정한다.
*/
const renderPromptComposer = ({
  applyAccept = true,
  isSubmitting = false,
} = {}) => {
  const onSubmit = vi.fn();

  const view = render(
    <PromptComposer isSubmitting={isSubmitting} onSubmit={onSubmit} />,
  );

  const fileInput =
    view.container.querySelector<HTMLInputElement>('input[type="file"]');

  if (!fileInput) throw new Error("파일 입력을 찾지 못했다");

  return {
    ...view,
    fileInput,
    onSubmit,
    user: userEvent.setup({ applyAccept }),
  };
};

const getAttachButton = () => screen.getByRole("button", { name: "파일 첨부" });

const getSubmitButton = () => screen.getByRole("button", { name: "전송" });

describe("PromptComposer", () => {
  it("첨부하면 첨부 버튼이 잠긴 상태가 된다", async () => {
    const { fileInput, user } = renderPromptComposer();

    expect(getAttachButton()).toHaveAttribute("aria-disabled", "false");

    await user.upload(fileInput, createFile("보고서.hwp"));

    expect(getAttachButton()).toHaveAttribute("aria-disabled", "true");
  });

  /*
  잠긴 이유는 title로 붙는다. 속성이 붙었는지가 아니라 설명으로 계산되는지를 확인해,
  나중에 aria-describedby로 방식을 바꿔도 이 테스트가 그대로 유지되게 한다.
  */
  it("잠긴 첨부 버튼이 제한 이유를 설명으로 갖는다", async () => {
    const { fileInput, user } = renderPromptComposer();

    expect(getAttachButton()).not.toHaveAccessibleDescription();

    await user.upload(fileInput, createFile("보고서.hwp"));

    expect(getAttachButton()).toHaveAccessibleDescription(
      "첨부는 1개까지 가능합니다.",
    );
  });

  /*
  aria-disabled는 브라우저가 클릭을 막아 주지 않으므로 onClick에서 직접 막는다.
  먼저 잠기지 않은 상태에서 열리는 것을 확인해, 감시 자체가 동작함을 보인다.
  */
  it("잠긴 첨부 버튼을 눌러도 파일 선택 창이 열리지 않는다", async () => {
    const { fileInput, user } = renderPromptComposer();

    const openPicker = vi.spyOn(fileInput, "click");

    await user.click(getAttachButton());
    expect(openPicker).toHaveBeenCalledTimes(1);

    await user.upload(fileInput, createFile("보고서.hwp"));
    openPicker.mockClear();

    await user.click(getAttachButton());
    expect(openPicker).not.toHaveBeenCalled();
  });

  it("첨부한 파일 이름이 목록에 보인다", async () => {
    const { fileInput, user } = renderPromptComposer();

    await user.upload(fileInput, createFile("보고서.hwp"));

    expect(screen.getByText("보고서.hwp")).toBeInTheDocument();
  });

  /*
  accept는 파일 선택 창의 편의 필터일 뿐이고 사용자가 "모든 파일"로 바꿔 우회할 수 있다.
  user-event는 기본적으로 accept에 맞지 않는 파일을 걸러 내므로 그 상황을 재현한다.
  */
  it("지원하지 않는 형식을 고르면 확장자 안내가 뜬다", async () => {
    const { fileInput, user } = renderPromptComposer({ applyAccept: false });

    await user.upload(fileInput, createFile("shot.png"));

    const notice = screen.getByRole("alert");

    expect(notice).toHaveTextContent("첨부할 수 없는 형식입니다: shot.png");
    expect(notice).toHaveTextContent("지원 형식:");
  });

  it("상한을 넘는 파일을 고르면 크기 안내가 뜬다", async () => {
    const { fileInput, user } = renderPromptComposer();

    await user.upload(
      fileInput,
      createFileOfSize("too_big.pdf", MAX_ATTACHMENT_SIZE_BYTES + 1),
    );

    const notice = screen.getByRole("alert");

    expect(notice).toHaveTextContent("용량이 너무 큽니다: too_big.pdf");
    expect(notice).toHaveTextContent("최대 10 MB까지 첨부할 수 있습니다.");
  });

  it("안내 닫기 버튼을 누르면 안내가 사라진다", async () => {
    const { fileInput, user } = renderPromptComposer({ applyAccept: false });

    await user.upload(fileInput, createFile("shot.png"));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "안내 닫기" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("입력이 비어 있으면 전송 버튼이 잠긴다", async () => {
    const { user } = renderPromptComposer();

    expect(getSubmitButton()).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "연구 요약");

    expect(getSubmitButton()).toBeEnabled();
  });

  it("입력 후 전송을 누르면 onSubmit이 draft로 호출된다", async () => {
    const { fileInput, onSubmit, user } = renderPromptComposer();

    await user.upload(fileInput, createFile("보고서.hwp"));
    await user.type(screen.getByRole("textbox"), "  연구 요약  ");
    await user.click(getSubmitButton());

    expect(onSubmit).toHaveBeenCalledWith({
      attachments: [expect.objectContaining({ name: "보고서.hwp" })],
      text: "연구 요약",
    });
  });

  it("isSubmitting이 true면 입력이 있어도 전송이 잠긴다", async () => {
    const { user } = renderPromptComposer({ isSubmitting: true });

    await user.type(screen.getByRole("textbox"), "연구 요약");

    expect(getSubmitButton()).toBeDisabled();
  });
});
