import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/src/entities/attachment";
import { MAX_PROMPT_MESSAGE_LENGTH } from "@/src/entities/tree";
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

/*
jsdom에는 DataTransfer가 없어 드래그 이벤트에 필요한 필드만 흉내 낸다.
파일 탐색기에서 끌어온 경우에만 types에 "Files"가 들어 있다.
*/
const createFileTransfer = (files: File[]) => ({
  dropEffect: "none",
  files,
  types: ["Files"],
});

/*
드롭 영역은 입력창을 감싼 요소다. 입력창에서 이벤트를 보내 버블링으로 닿게 해,
사용자가 영역 안의 아무 곳에나 놓는 상황을 재현한다.
*/
const dropFiles = (files: File[]) => {
  const target = screen.getByRole("textbox");
  const dataTransfer = createFileTransfer(files);

  fireEvent.dragEnter(target, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
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
    expect(notice).toHaveTextContent("25 MB까지 첨부할 수 있습니다.");
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

  /*
  입력한 뒤에 잠기는 순서라 isSubmitting을 나중에 올린다. 처음부터 true로 두면 지시문을
  입력할 수 없어(readOnly) "입력이 있어도"를 확인하지 못한다.
  */
  it("isSubmitting이 true면 입력이 있어도 전송이 잠긴다", async () => {
    const { onSubmit, rerender, user } = renderPromptComposer();

    await user.type(screen.getByRole("textbox"), "연구 요약");

    rerender(<PromptComposer isSubmitting onSubmit={onSubmit} />);

    expect(screen.getByRole("textbox")).toHaveValue("연구 요약");
    expect(getSubmitButton()).toBeDisabled();
  });

  /*
  생성 중에 지시문이나 첨부를 바꿀 수 있으면, 그 변경은 이미 나간 요청에 실리지 않는데도
  성공해서 입력을 비울 때 함께 사라진다. 보낸 내용은 그대로 읽을 수 있어야 하므로 감추지 않고 잠근다.
  */
  it("생성 중에는 지시문과 첨부를 바꿀 수 없다", async () => {
    const { fileInput, onSubmit, rerender, user } = renderPromptComposer();

    await user.upload(fileInput, createFile("보고서.hwp"));
    await user.type(screen.getByRole("textbox"), "연구 요약");

    rerender(<PromptComposer isSubmitting onSubmit={onSubmit} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(getAttachButton()).toHaveAccessibleDescription(
      "트리를 만드는 동안에는 첨부를 바꿀 수 없습니다.",
    );
    expect(
      screen.queryByRole("button", { name: "보고서.hwp 첨부 제거" }),
    ).not.toBeInTheDocument();
  });

  /*
  타자로 500자를 넘기면 테스트가 느려지므로 값을 한 번에 붙여 넣는다.
  */
  it("지시문이 상한을 넘으면 안내가 나오고 전송이 잠긴다", async () => {
    const { user } = renderPromptComposer();
    const textbox = screen.getByRole("textbox");

    await user.click(textbox);
    await user.paste("가".repeat(MAX_PROMPT_MESSAGE_LENGTH + 1));

    expect(screen.getByText(/지시문은 최대/)).toBeInTheDocument();
    expect(getSubmitButton()).toBeDisabled();
  });

  it("상한 이내면 안내가 나오지 않는다", async () => {
    const { user } = renderPromptComposer();
    const textbox = screen.getByRole("textbox");

    await user.click(textbox);
    await user.paste("가".repeat(MAX_PROMPT_MESSAGE_LENGTH));

    expect(screen.queryByText(/지시문은 최대/)).not.toBeInTheDocument();
    expect(getSubmitButton()).toBeEnabled();
  });

  describe("파일 드롭", () => {
    it("입력 영역에 놓은 파일이 첨부 목록에 보인다", () => {
      renderPromptComposer();

      dropFiles([createFile("보고서.hwp")]);

      expect(screen.getByText("보고서.hwp")).toBeInTheDocument();
      expect(getAttachButton()).toHaveAttribute("aria-disabled", "true");
    });

    it("파일을 끌어 올리면 안내 덮개가 나타나고, 벗어나면 사라진다", () => {
      renderPromptComposer();
      const target = screen.getByRole("textbox");
      const dataTransfer = createFileTransfer([createFile("보고서.hwp")]);

      fireEvent.dragEnter(target, { dataTransfer });
      expect(screen.getByText("여기에 놓아 파일 첨부")).toBeInTheDocument();

      fireEvent.dragLeave(target, { dataTransfer });
      expect(
        screen.queryByText("여기에 놓아 파일 첨부"),
      ).not.toBeInTheDocument();
    });

    /*
    영역 안의 자식 요소를 지날 때마다 dragenter와 dragleave가 짝지어 발생한다.
    한 번 나갔다고 강조를 끄면 버튼 위를 지날 때마다 깜빡인다.
    */
    it("영역 안의 다른 요소로 옮겨 가도 덮개가 유지된다", () => {
      renderPromptComposer();
      const dataTransfer = createFileTransfer([createFile("보고서.hwp")]);

      fireEvent.dragEnter(screen.getByRole("textbox"), { dataTransfer });
      fireEvent.dragEnter(getAttachButton(), { dataTransfer });
      fireEvent.dragLeave(screen.getByRole("textbox"), { dataTransfer });

      expect(screen.getByText("여기에 놓아 파일 첨부")).toBeInTheDocument();
    });

    it("파일이 아닌 항목을 끌면 반응하지 않는다", () => {
      renderPromptComposer();

      fireEvent.dragEnter(screen.getByRole("textbox"), {
        dataTransfer: { files: [], types: ["text/plain"] },
      });

      expect(
        screen.queryByText("여기에 놓아 파일 첨부"),
      ).not.toBeInTheDocument();
    });

    it("여러 파일을 놓으면 하나만 첨부하고 나머지는 개수 안내로 알린다", () => {
      renderPromptComposer();

      dropFiles([createFile("보고서.hwp"), createFile("요약.pdf")]);

      expect(screen.getByText("보고서.hwp")).toBeInTheDocument();

      const notice = screen.getByRole("alert");
      expect(notice).toHaveTextContent("첨부하지 않은 파일: 요약.pdf");
      expect(notice).toHaveTextContent("첨부는 1개까지 가능합니다.");
    });

    it("지원하지 않는 형식을 놓으면 확장자 안내가 뜬다", () => {
      renderPromptComposer();

      dropFiles([createFile("shot.png")]);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "첨부할 수 없는 형식입니다: shot.png",
      );
    });

    it("첨부가 잠겨 있으면 덮개에 이유를 띄우고 놓아도 받지 않는다", () => {
      renderPromptComposer();
      dropFiles([createFile("보고서.hwp")]);

      const dataTransfer = createFileTransfer([createFile("요약.pdf")]);
      fireEvent.dragEnter(screen.getByRole("textbox"), { dataTransfer });

      expect(
        screen.getByText("첨부는 1개까지 가능합니다."),
      ).toBeInTheDocument();

      fireEvent.drop(screen.getByRole("textbox"), { dataTransfer });

      expect(screen.queryByText("요약.pdf")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("생성 중에는 놓아도 받지 않는다", () => {
      renderPromptComposer({ isSubmitting: true });

      dropFiles([createFile("보고서.hwp")]);

      expect(screen.queryByText("보고서.hwp")).not.toBeInTheDocument();
    });

    /*
    입력창을 빗나가 놓으면 브라우저가 파일을 열어 작성 중인 페이지를 벗어난다.
    */
    it("입력 영역 밖에 놓아도 브라우저 기본 동작을 막는다", () => {
      renderPromptComposer();
      const dataTransfer = createFileTransfer([createFile("보고서.hwp")]);

      const isDropAllowed = fireEvent.drop(document.body, { dataTransfer });

      expect(isDropAllowed).toBe(false); // preventDefault가 호출되면 false다
      expect(screen.queryByText("보고서.hwp")).not.toBeInTheDocument();
    });

    it("입력 영역이 사라지면 페이지의 드롭을 막지 않는다", () => {
      const { unmount } = renderPromptComposer();
      unmount();

      const isDropAllowed = fireEvent.drop(document.body, {
        dataTransfer: createFileTransfer([createFile("보고서.hwp")]),
      });

      expect(isDropAllowed).toBe(true);
    });

    it("파일이 아닌 항목은 영역 밖에서도 막지 않는다", () => {
      renderPromptComposer();

      const isDropAllowed = fireEvent.drop(document.body, {
        dataTransfer: { files: [], types: ["text/plain"] },
      });

      expect(isDropAllowed).toBe(true);
    });
  });
});
