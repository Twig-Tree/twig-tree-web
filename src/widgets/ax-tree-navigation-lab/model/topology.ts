export type TopologyPoint = {
  depth: number;
  breadth: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

type ScreenAxis = "x" | "y";

export type TopologyProjection = {
  origin: ScreenPoint;
  depth: {
    screenAxis: ScreenAxis;
    direction: 1 | -1;
    step: number;
  };
  breadth: {
    screenAxis: ScreenAxis;
    direction: 1 | -1;
    step: number;
  };
};

export type TopologyWindow = {
  origin: TopologyPoint;
  size: {
    depth: number;
    breadth: number;
  };
};

/*
위상 좌표는 화면의 x/y와 독립적이다. 전개 방향이 바뀌면 projection만 교체하고,
읽기 창·포커스 복원·탐색 로직은 depth/breadth 좌표를 그대로 사용한다.
*/
export const projectTopologyPoint = (
  point: TopologyPoint,
  projection: TopologyProjection,
): ScreenPoint => {
  if (projection.depth.screenAxis === projection.breadth.screenAxis) {
    throw new Error("Topology axes must project to different screen axes.");
  }

  const screenPoint: ScreenPoint = { ...projection.origin };

  screenPoint[projection.depth.screenAxis] +=
    point.depth * projection.depth.step * projection.depth.direction;
  screenPoint[projection.breadth.screenAxis] +=
    point.breadth * projection.breadth.step * projection.breadth.direction;

  return screenPoint;
};

export const createTopologyWindow = (
  origin: TopologyPoint,
  depthSlots: number,
  breadthSlots: number,
): TopologyWindow => ({
  origin,
  size: {
    depth: Math.max(1, Math.floor(depthSlots)),
    breadth: Math.max(1, Math.floor(breadthSlots)),
  },
});

export const isTopologyPointInWindow = (
  point: TopologyPoint,
  window: TopologyWindow,
) =>
  point.depth >= window.origin.depth &&
  point.depth < window.origin.depth + window.size.depth &&
  point.breadth >= window.origin.breadth &&
  point.breadth < window.origin.breadth + window.size.breadth;
