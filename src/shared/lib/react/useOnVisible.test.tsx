import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { mockIntersectionObserver } from "@/src/tests/helpers/mockIntersectionObserver";
import { useOnVisible } from "./useOnVisible";

let notifyIntersection: (isIntersecting: boolean) => void;

beforeEach(() => {
  ({ notifyIntersection } = mockIntersectionObserver());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function Sentinel({
  isShown = true,
  onVisible,
}: {
  isShown?: boolean;
  onVisible: () => void;
}) {
  const ref = useOnVisible<HTMLDivElement>(onVisible);

  return isShown ? <div ref={ref} /> : null;
}

describe("useOnVisible", () => {
  it("요소가 화면에 들어오면 callback을 부른다", () => {
    const onVisible = vi.fn();
    render(<Sentinel onVisible={onVisible} />);

    notifyIntersection(true);

    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it("요소가 화면 밖에 있으면 부르지 않는다", () => {
    const onVisible = vi.fn();
    render(<Sentinel onVisible={onVisible} />);

    notifyIntersection(false);

    expect(onVisible).not.toHaveBeenCalled();
  });

  /*
  observer를 렌더마다 다시 붙이지 않으므로, 이전 렌더의 callback을 쥐고 있으면 낡은 상태로 동작한다.
  */
  it("알림 시점의 최신 callback을 부른다", () => {
    const firstOnVisible = vi.fn();
    const latestOnVisible = vi.fn();
    const { rerender } = render(<Sentinel onVisible={firstOnVisible} />);

    rerender(<Sentinel onVisible={latestOnVisible} />);
    notifyIntersection(true);

    expect(firstOnVisible).not.toHaveBeenCalled();
    expect(latestOnVisible).toHaveBeenCalledTimes(1);
  });

  it("요소가 사라지면 감지를 멈춘다", () => {
    const onVisible = vi.fn();
    const { rerender } = render(<Sentinel onVisible={onVisible} />);

    rerender(<Sentinel isShown={false} onVisible={onVisible} />);
    notifyIntersection(true);

    expect(onVisible).not.toHaveBeenCalled();
  });

  /*
  다음 페이지를 받는 동안 감지 요소를 숨겼다가 다시 그리는 경우다. 새 요소에 observer를 다시 붙여야
  이미 보이는 상태에서도 알림이 다시 온다.
  */
  it("요소를 다시 그리면 새 요소를 감지한다", () => {
    const onVisible = vi.fn();
    const { rerender } = render(<Sentinel onVisible={onVisible} />);

    rerender(<Sentinel isShown={false} onVisible={onVisible} />);
    rerender(<Sentinel onVisible={onVisible} />);
    notifyIntersection(true);

    expect(onVisible).toHaveBeenCalledTimes(1);
  });
});
