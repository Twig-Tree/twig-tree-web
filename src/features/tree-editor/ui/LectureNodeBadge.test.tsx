import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLectureAnimationStore } from "../model/lecture/lectureAnimationStore";
import { LectureNodeBadge } from "./LectureNodeBadge";

afterEach(() => {
  useLectureAnimationStore.getState().resetVisual();
});

describe("LectureNodeBadge", () => {
  it("꼬리표가 없으면 아무것도 그리지 않는다", () => {
    const { container } = render(<LectureNodeBadge clientId="c1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("노드에 붙은 꼬리표를 톤과 함께 그린다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "badge",
      type: "badge",
      clientIds: new Set(["c1"]),
      label: "정답",
      tone: "success",
    });

    render(<LectureNodeBadge clientId="c1" />);

    expect(screen.getByText("정답")).toHaveAttribute("data-tone", "success");
  });

  it("다른 노드의 꼬리표는 그리지 않는다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "badge",
      type: "badge",
      clientIds: new Set(["c2"]),
      label: "핵심",
      tone: "accent",
    });

    const { container } = render(<LectureNodeBadge clientId="c1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("한 노드에 꼬리표가 겹치면 나중에 붙인 꼬리표를 그린다", () => {
    const store = useLectureAnimationStore.getState();
    store.setLayer({
      id: "first",
      type: "badge",
      clientIds: new Set(["c1"]),
      label: "①",
      tone: "accent",
    });
    store.setLayer({
      id: "second",
      type: "badge",
      clientIds: new Set(["c1"]),
      label: "②",
      tone: "accent",
    });

    render(<LectureNodeBadge clientId="c1" />);

    expect(screen.getByText("②")).toBeInTheDocument();
    expect(screen.queryByText("①")).toBeNull();
  });

  it.each([
    ["★", "glyph"],
    ["1", "glyph"],
    ["X", "glyph"],
    ["정답", "text"],
    ["12", "text"],
  ])("꼬리표 %s는 %s 모양으로 그린다", (label, shape) => {
    useLectureAnimationStore.getState().setLayer({
      id: "badge",
      type: "badge",
      clientIds: new Set(["c1"]),
      label,
      tone: "accent",
    });

    render(<LectureNodeBadge clientId="c1" />);

    expect(screen.getByText(label)).toHaveAttribute("data-shape", shape);
  });
});
