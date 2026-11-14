import { describe, expect, it } from "vitest";
import {
  getAnimationCompositionIssues,
  SHOWCASE_DEMO_LECTURE,
} from "@/src/entities/lecture";
import { getLabShowcaseAnimation } from "./labShowcase";

describe("getLabShowcaseAnimation", () => {
  it("발표 시연 강의의 비트를 모두 잇고 장면 사이에서 효과를 지운다", () => {
    const animation = getLabShowcaseAnimation();

    expect(animation?.type).toBe("group");
    if (animation?.type !== "group") return;

    const resets = animation.children.filter((child) => child.type === "reset");
    const beats = animation.children.filter((child) => child.type === "group");

    expect(resets).toHaveLength(4);
    expect(beats).toHaveLength(10);
  });

  it("고정 트리의 노드 ID로 연결한다", () => {
    const script = SHOWCASE_DEMO_LECTURE.createScript((path) => path.join("/"));

    expect(script?.scenes[0].nodeId).toBe("컴퓨터 사이언스");
    expect(JSON.stringify(getLabShowcaseAnimation())).toContain(
      '"targetNodeIds":["1"]',
    );
  });

  /*
  마지막 장면의 유지 효과는 강의가 끝날 때 플레이어가 지우므로 끝까지 남아도 된다.
  */
  it("연출 조합 규칙에 걸리는 곳이 없다", () => {
    const animation = getLabShowcaseAnimation();

    expect(
      animation &&
        getAnimationCompositionIssues(animation, {
          allowLingeringPersist: true,
        }),
    ).toEqual([]);
  });
});
