import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  getLectureEdgeKey,
  useLectureAnimationStore,
} from "../model/lecture/lectureAnimationStore";
import { type CustomEditorEdge } from "../model/types";
import { CustomEdge } from "./CustomEdge";

const edgeProps: EdgeProps<CustomEditorEdge> = {
  id: "parent-child",
  source: "parent",
  target: "child",
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
};

afterEach(() => {
  useLectureAnimationStore.getState().resetVisual();
});

describe("CustomEdge", () => {
  it("추적 대상인 부모-자식 연결선에 애니메이션 클래스를 적용한다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "trace",
      type: "trace",
      edgeKeys: new Set([getLectureEdgeKey("parent", "child")]),
    });

    const { container } = render(
      <svg>
        <CustomEdge {...edgeProps} />
      </svg>,
    );

    expect(container.querySelector(".lecture-edge-traced")).not.toBeNull();
  });

  it("역방향 추적이면 역방향 클래스를 함께 적용한다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "trace",
      type: "trace",
      edgeKeys: new Set([getLectureEdgeKey("parent", "child")]),
      direction: "reverse",
    });

    const { container } = render(
      <svg>
        <CustomEdge {...edgeProps} />
      </svg>,
    );

    expect(
      container.querySelector(".lecture-edge-traced-reverse"),
    ).not.toBeNull();
  });

  it("혜성 추적이면 점선 대신 연결선 경로를 따라 그리는 혜성을 덧그린다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "trace",
      type: "trace",
      edgeKeys: new Set([getLectureEdgeKey("parent", "child")]),
      direction: "reverse",
      style: "comet",
    });

    const { container } = render(
      <svg>
        <CustomEdge {...edgeProps} />
      </svg>,
    );

    const edgePath = container
      .querySelector(".react-flow__edge-path")
      ?.getAttribute("d");

    expect(container.querySelector(".lecture-edge-traced")).toBeNull();
    expect(container.querySelector(".lecture-comet-reverse")).not.toBeNull();
    expect(
      container.querySelector(".lecture-comet__line")?.getAttribute("d"),
    ).toBe(edgePath);
    expect(
      container
        .querySelector(".lecture-comet__line")
        ?.getAttribute("pathLength"),
    ).toBe("1");
  });

  it("추적이 끝나면 혜성을 지운다", () => {
    const { container } = render(
      <svg>
        <CustomEdge {...edgeProps} />
      </svg>,
    );

    expect(container.querySelector(".lecture-comet")).toBeNull();
  });

  it("다른 연결선을 추적할 때는 애니메이션 클래스를 적용하지 않는다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "trace",
      type: "trace",
      edgeKeys: new Set([getLectureEdgeKey("parent", "other-child")]),
    });

    const { container } = render(
      <svg>
        <CustomEdge {...edgeProps} />
      </svg>,
    );

    expect(container.querySelector(".lecture-edge-traced")).toBeNull();
  });

  it("추적 대상이 아닌 연결선에는 애니메이션 클래스를 적용하지 않는다", () => {
    const { container } = render(
      <svg>
        <CustomEdge {...edgeProps} />
      </svg>,
    );

    expect(container.querySelector(".lecture-edge-traced")).toBeNull();
  });
});
