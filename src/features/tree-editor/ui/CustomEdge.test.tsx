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

  it("추적 대상이 아닌 연결선에는 애니메이션 클래스를 적용하지 않는다", () => {
    const { container } = render(
      <svg>
        <CustomEdge {...edgeProps} />
      </svg>,
    );

    expect(container.querySelector(".lecture-edge-traced")).toBeNull();
  });
});
