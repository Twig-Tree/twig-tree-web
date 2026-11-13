import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect } from "vitest";
import { ConfirmDialogHost } from "./ConfirmDialogHost";
import { requestConfirm, useConfirmDialogStore } from "./confirmDialogStore";

const DELETE_REQUEST = {
  title: '"자료" 폴더를 삭제할까요?',
  description: "되돌릴 수 없습니다.",
  confirmLabel: "삭제",
  tone: "danger",
} as const;

/*
요청을 열고 답을 기다리는 Promise를 돌려준다. act 안에서 열어야 store 변화가 화면에 반영된다.
*/
const openRequest = (input: Parameters<typeof requestConfirm>[0]) => {
  let answer!: Promise<boolean>;

  act(() => {
    answer = requestConfirm(input);
  });

  return answer;
};

describe("ConfirmDialogHost", () => {
  beforeEach(() => {
    useConfirmDialogStore.setState({ request: null, resolveRequest: null });
  });

  it("요청이 없으면 내용을 그리지 않는다", () => {
    render(<ConfirmDialogHost />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("요청한 제목, 설명, 확인 버튼 문구를 보여준다", () => {
    render(<ConfirmDialogHost />);

    void openRequest(DELETE_REQUEST);

    expect(
      screen.getByRole("heading", { name: '"자료" 폴더를 삭제할까요?' }),
    ).toBeInTheDocument();
    expect(screen.getByText("되돌릴 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  /*
  showModal은 처음 만나는 버튼에 focus를 준다. 취소가 앞에 있어야 Enter 한 번에 삭제되지 않는다.
  */
  it("취소 버튼을 확인 버튼보다 앞에 둔다", () => {
    render(<ConfirmDialogHost />);

    void openRequest(DELETE_REQUEST);

    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["취소", "삭제"]);
  });

  it("확인을 누르면 true로 끝나고 창을 닫는다", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialogHost />);

    const answer = openRequest(DELETE_REQUEST);
    await user.click(screen.getByRole("button", { name: "삭제" }));

    await expect(answer).resolves.toBe(true);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("취소를 누르면 false로 끝나고 창을 닫는다", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialogHost />);

    const answer = openRequest(DELETE_REQUEST);
    await user.click(screen.getByRole("button", { name: "취소" }));

    await expect(answer).resolves.toBe(false);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  /*
  Esc는 dialog에 cancel 이벤트로 도착한다. 답 없이 닫히면 요청한 쪽이 다음 단계로 가지 못한다.
  */
  it("Esc로 닫으면 false로 끝난다", async () => {
    const { container } = render(<ConfirmDialogHost />);

    const answer = openRequest(DELETE_REQUEST);
    act(() => {
      fireEvent(
        container.ownerDocument.querySelector("dialog")!,
        new Event("cancel", { cancelable: true }),
      );
    });

    await expect(answer).resolves.toBe(false);
  });

  it("설명이 없으면 제목만 보여준다", () => {
    render(<ConfirmDialogHost />);

    void openRequest({ title: "태그를 삭제할까요?", confirmLabel: "삭제" });

    expect(screen.getByRole("heading")).toHaveTextContent("태그를 삭제할까요?");
    expect(screen.queryByText("되돌릴 수 없습니다.")).not.toBeInTheDocument();
  });
});

describe("confirmDialogStore", () => {
  beforeEach(() => {
    useConfirmDialogStore.setState({ request: null, resolveRequest: null });
  });

  /*
  답을 받지 못한 Promise가 남으면 그 호출부는 영원히 기다린다.
  */
  it("열린 요청이 있는데 새 요청이 오면 앞 요청을 false로 끝낸다", async () => {
    const first = requestConfirm(DELETE_REQUEST);
    void requestConfirm({ ...DELETE_REQUEST, title: "다른 요청" });

    await expect(first).resolves.toBe(false);
    expect(useConfirmDialogStore.getState().request?.title).toBe("다른 요청");
  });

  it("이미 끝난 요청의 ID로 답하면 지금 열린 요청을 건드리지 않는다", () => {
    void requestConfirm(DELETE_REQUEST);
    const staleId = useConfirmDialogStore.getState().request!.id;
    void requestConfirm({ ...DELETE_REQUEST, title: "다른 요청" });

    useConfirmDialogStore.getState().settleConfirm(staleId, true);

    expect(useConfirmDialogStore.getState().request?.title).toBe("다른 요청");
  });
});
