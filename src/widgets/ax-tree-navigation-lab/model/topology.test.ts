import { describe, expect, it } from "vitest";
import {
  createTopologyWindow,
  isTopologyPointInWindow,
  projectTopologyPoint,
  type TopologyProjection,
} from "./topology";

const horizontalProjection: TopologyProjection = {
  origin: { x: 10, y: 20 },
  depth: { screenAxis: "x", direction: 1, step: 232 },
  breadth: { screenAxis: "y", direction: 1, step: 92 },
};

describe("topology coordinates", () => {
  it("자식과 형제 축을 현재 가로 전개 화면에 투영한다", () => {
    expect(
      projectTopologyPoint({ depth: 2, breadth: 3 }, horizontalProjection),
    ).toEqual({ x: 474, y: 296 });
  });

  it("화면 전개 방향이 바뀌어도 같은 위상 좌표를 사용한다", () => {
    expect(
      projectTopologyPoint(
        { depth: 2, breadth: 3 },
        {
          origin: { x: 500, y: 10 },
          depth: { screenAxis: "y", direction: 1, step: 120 },
          breadth: { screenAxis: "x", direction: -1, step: 80 },
        },
      ),
    ).toEqual({ x: 260, y: 250 });
  });

  it("읽기 창의 끝 경계를 포함하지 않는 슬롯 범위로 판정한다", () => {
    const window = createTopologyWindow({ depth: 2, breadth: 4 }, 3, 4);

    expect(isTopologyPointInWindow({ depth: 4, breadth: 7 }, window)).toBe(
      true,
    );
    expect(isTopologyPointInWindow({ depth: 5, breadth: 7 }, window)).toBe(
      false,
    );
    expect(isTopologyPointInWindow({ depth: 4, breadth: 8 }, window)).toBe(
      false,
    );
  });
});
