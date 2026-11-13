import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { TOAST_DURATION_MS, Toaster } from "./Toaster";
import { MAX_TOASTS, showToast, useToastStore } from "./toastStore";

describe("Toaster", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("띄운 토스트의 문구를 보여준다", () => {
    render(<Toaster />);

    act(() => showToast({ message: "저장했습니다." }));

    expect(screen.getByRole("status")).toHaveTextContent("저장했습니다.");
  });

  /*
  error는 읽던 안내를 끊고 바로 알려야 한다. info는 둘러싼 polite 영역에 맡긴다.
  */
  it("error 토스트는 alert로 알린다", () => {
    render(<Toaster />);

    act(() => showToast({ message: "옮기지 못했습니다.", tone: "error" }));

    expect(screen.getByRole("alert")).toHaveTextContent("옮기지 못했습니다.");
  });

  it("정해진 시간이 지나면 저절로 사라진다", () => {
    vi.useFakeTimers();
    render(<Toaster />);

    act(() => showToast({ message: "저장했습니다." }));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));
    expect(screen.getByText("저장했습니다.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("저장했습니다.")).not.toBeInTheDocument();
  });

  it("닫기를 누르면 바로 사라진다", async () => {
    const user = userEvent.setup();
    render(<Toaster />);

    act(() => showToast({ message: "저장했습니다." }));
    await user.click(screen.getByRole("button", { name: "알림 닫기" }));

    expect(screen.queryByText("저장했습니다.")).not.toBeInTheDocument();
  });

  /*
  실패가 빠르게 쌓여도 화면이 토스트로 덮이지 않아야 한다. 가장 최근 것이 남는다.
  */
  it("상한을 넘으면 가장 오래된 토스트부터 지운다", () => {
    render(<Toaster />);

    act(() => {
      for (let index = 0; index <= MAX_TOASTS; index += 1) {
        showToast({ message: `알림 ${index}` });
      }
    });

    expect(screen.getAllByRole("status")).toHaveLength(MAX_TOASTS);
    expect(screen.queryByText("알림 0")).not.toBeInTheDocument();
    expect(screen.getByText(`알림 ${MAX_TOASTS}`)).toBeInTheDocument();
  });
});
