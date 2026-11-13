import {
  createTopologyWindow,
  type TopologyPoint,
  type TopologyWindow,
} from "./topology";

export type ReadingFrameInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type ReadingViewportInput = {
  frameWidth: number;
  frameHeight: number;
  minZoom: number;
  maxZoom: number;
  minRows: number;
  minDepths: number;
  focusPosition: { x: number; y: number };
  focusTopology: TopologyPoint;
  nodeWidth: number;
  nodeHeight: number;
  layerGap: number;
  siblingGap: number;
  insets: ReadingFrameInsets;
};

export type ReadingCapacity = {
  rows: number;
  depths: number;
  zoom: number;
  isMinimumSatisfied: boolean;
  trailingRight: number;
  trailingBottom: number;
};

export type ReadingViewportResult = {
  viewport: { x: number; y: number; zoom: number };
  capacity: ReadingCapacity;
  topologyWindow: TopologyWindow;
};

const getSlotCount = (
  availableScreenSize: number,
  zoom: number,
  nodeSize: number,
  gap: number,
) => {
  const availableFlowSize = Math.max(0, availableScreenSize) / zoom;

  return Math.max(1, Math.floor((availableFlowSize + gap) / (nodeSize + gap)));
};

const getOccupiedScreenSize = (
  count: number,
  zoom: number,
  nodeSize: number,
  gap: number,
) => (count * nodeSize + Math.max(0, count - 1) * gap) * zoom;

const getRequiredFlowSize = (count: number, nodeSize: number, gap: number) =>
  count * nodeSize + Math.max(0, count - 1) * gap;

/*
포커스 노드의 왼쪽 위를 읽기 창의 기준점에 놓고, 최소 슬롯 수를 만족하는 가장 큰 배율을 계산한다.
계산 배율이 가독성 하한보다 작으면 슬롯 수보다 하한을 우선한다.
앞쪽 패딩은 기준점을 안정적으로 유지하고, 슬롯을 채우고 남은 공간은 오른쪽과 아래쪽의 후행 패딩이 된다.
*/
export const getReadingViewport = ({
  frameWidth,
  frameHeight,
  minZoom,
  maxZoom,
  minRows,
  minDepths,
  focusPosition,
  focusTopology,
  nodeWidth,
  nodeHeight,
  layerGap,
  siblingGap,
  insets,
}: ReadingViewportInput): ReadingViewportResult => {
  const availableWidth = Math.max(0, frameWidth - insets.left - insets.right);
  const availableHeight = Math.max(0, frameHeight - insets.top - insets.bottom);
  const requiredWidth = getRequiredFlowSize(minDepths, nodeWidth, layerGap);
  const requiredHeight = getRequiredFlowSize(minRows, nodeHeight, siblingGap);
  const largestFittingZoom = Math.min(
    maxZoom,
    availableWidth / requiredWidth,
    availableHeight / requiredHeight,
  );
  const zoom = Math.max(minZoom, largestFittingZoom);
  const depths = getSlotCount(availableWidth, zoom, nodeWidth, layerGap);
  const rows = getSlotCount(availableHeight, zoom, nodeHeight, siblingGap);
  const occupiedWidth = getOccupiedScreenSize(
    depths,
    zoom,
    nodeWidth,
    layerGap,
  );
  const occupiedHeight = getOccupiedScreenSize(
    rows,
    zoom,
    nodeHeight,
    siblingGap,
  );

  return {
    viewport: {
      x: insets.left - focusPosition.x * zoom,
      y: insets.top - focusPosition.y * zoom,
      zoom,
    },
    capacity: {
      rows,
      depths,
      zoom,
      isMinimumSatisfied: rows >= minRows && depths >= minDepths,
      trailingRight: Math.max(
        insets.right,
        frameWidth - insets.left - occupiedWidth,
      ),
      trailingBottom: Math.max(
        insets.bottom,
        frameHeight - insets.top - occupiedHeight,
      ),
    },
    topologyWindow: createTopologyWindow(focusTopology, depths, rows),
  };
};
