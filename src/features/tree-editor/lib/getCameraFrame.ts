/*
캔버스를 가리는 UI는 data-camera-inset 속성에 가리는 쪽을 적어 표시한다. 카메라는 움직일 때마다 표시된 요소의 크기를 재서
실제로 보이는 영역(시각 프레임)을 구한다. 패널이 캔버스와 나란히 놓이면 겹치지 않아 0이 되고, 겹쳐 뜨면 겹친 만큼 빠진다.
자막 줄 수처럼 크기가 수시로 달라지므로 값을 들고 있지 않고 그때그때 잰다.
*/
const CAMERA_INSET_SIDES = ["top", "right", "bottom", "left"] as const;

type CameraInsetSide = (typeof CAMERA_INSET_SIDES)[number];

export type CameraFrameInsets = Record<CameraInsetSide, number>;

type FrameRect = Pick<DOMRect, "top" | "right" | "bottom" | "left">;

type CameraObstacle = {
  side: CameraInsetSide; // 캔버스의 어느 쪽을 가리는지
  rect: FrameRect; // 가리는 UI의 화면 좌표
};

const FRAME_MARGIN_PX = 24; // 노드와 시각 프레임 가장자리 사이의 여백
/*
패널이 열려 시각 프레임이 줄어들 때 원래 보던 화면을 축소해 담더라도, 노드 글자가 이 크기보다 작아지면
읽기 어려우므로 더 줄이지 않고 선택한 노드 주변을 유지한다. 기준을 바꾸기 쉽도록 한곳에 둔다.
*/
export const MIN_READABLE_NODE_FONT_SIZE_PX = 10;
export const DEFAULT_NODE_FONT_SIZE_PX = 13;
/*
이보다 좁게 남으면 최소 배율의 노드 하나와 양쪽 여백(48px)도 들어가지 않으므로 그 방향의 가림을 무시한다. 노드는 최소 배율에서 약 50×18px이다.
*/
const MIN_FRAME_WIDTH_PX = 100;
const MIN_FRAME_HEIGHT_PX = 70;

const isCameraInsetSide = (side: string | undefined): side is CameraInsetSide =>
  CAMERA_INSET_SIDES.some((insetSide) => insetSide === side);

/*
함수 이름 : getCameraFrameInsets
기능 : 캔버스와 겹치는 UI들로 캔버스의 네 방향에서 가려진 거리를 구한다. 겹치지 않거나 크기가 없는 UI는 빼고, 같은 쪽을 가리는 UI가 여럿이면 가장 깊은 값을 쓴다.
인자 : FrameRect canvas -> 캔버스의 화면 좌표
CameraObstacle[] obstacles -> 가리는 UI 목록
반환값 : 네 방향에서 가려진 거리

좁은 화면에서는 양쪽 패널이 캔버스를 거의 덮을 수 있다. 남은 폭이 음수가 되면 배율 계산이 깨지므로 그 방향의 가림을 무시한다.
*/
export const getCameraFrameInsets = (
  canvas: FrameRect,
  obstacles: CameraObstacle[],
): CameraFrameInsets => {
  const insets: CameraFrameInsets = { top: 0, right: 0, bottom: 0, left: 0 };

  for (const { side, rect } of obstacles) {
    const overlap = {
      top: Math.max(rect.top, canvas.top),
      right: Math.min(rect.right, canvas.right),
      bottom: Math.min(rect.bottom, canvas.bottom),
      left: Math.max(rect.left, canvas.left),
    };

    if (overlap.right <= overlap.left || overlap.bottom <= overlap.top) {
      continue;
    }

    const depth = {
      top: overlap.bottom - canvas.top,
      right: canvas.right - overlap.left,
      bottom: canvas.bottom - overlap.top,
      left: overlap.right - canvas.left,
    }[side];

    insets[side] = Math.max(insets[side], depth);
  }

  const canvasWidth = canvas.right - canvas.left;
  const canvasHeight = canvas.bottom - canvas.top;

  return {
    ...(canvasWidth - insets.left - insets.right < MIN_FRAME_WIDTH_PX
      ? { left: 0, right: 0 }
      : { left: insets.left, right: insets.right }),
    ...(canvasHeight - insets.top - insets.bottom < MIN_FRAME_HEIGHT_PX
      ? { top: 0, bottom: 0 }
      : { top: insets.top, bottom: insets.bottom }),
  };
};

/*
함수 이름 : measureCameraFrameInsets
기능 : data-camera-inset으로 표시된 UI의 지금 크기를 재서 캔버스에서 가려진 거리를 구한다.
인자 : FrameRect canvas -> 캔버스의 화면 좌표
반환값 : 네 방향에서 가려진 거리
*/
export const measureCameraFrameInsets = (
  canvas: FrameRect,
): CameraFrameInsets => {
  const elements = document.querySelectorAll<HTMLElement>(
    "[data-camera-inset]",
  );

  return getCameraFrameInsets(
    canvas,
    [...elements].flatMap((element) => {
      const side = element.dataset.cameraInset;

      return isCameraInsetSide(side)
        ? [{ side, rect: element.getBoundingClientRect() }]
        : [];
    }),
  );
};

export type CanvasFrame = {
  width: number; // 캔버스 너비
  height: number; // 캔버스 높이
  insets: CameraFrameInsets; // 네 방향에서 가려진 거리
};

export type FlowViewport = { x: number; y: number; zoom: number };

/*
시각 프레임이 바뀌어도 유지할 기준 위상 정보. 사용자가 보던 시각 프레임 중심의 흐름 좌표와
그 프레임 안에 들어오던 가로·세로 흐름 길이를 기억해 두면, 패널을 다시 닫았을 때 원래 배율과 자리로 돌아간다.
*/
export type CameraReferencePhase = {
  center: { x: number; y: number };
  flowWidth: number;
  flowHeight: number;
  zoom: number;
};

/*
함수 이름 : measureNodeBaseFontSize
기능 : 테마의 노드 기본 글자 크기(--theme-node-font-size)를 px 숫자로 읽는다.
인자 : Element | null | undefined element -> CSS 변수를 읽을 요소. 없으면 documentElement에서 읽는다
반환값 : 노드 기본 글자 크기(px)
*/
export const measureNodeBaseFontSize = (element?: Element | null): number => {
  const target =
    element ??
    (typeof document !== "undefined" ? document.documentElement : null);

  if (!target) return DEFAULT_NODE_FONT_SIZE_PX;

  const parsed = Number.parseFloat(
    getComputedStyle(target).getPropertyValue("--theme-node-font-size"),
  );

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_NODE_FONT_SIZE_PX;
};

/*
함수 이름 : getCameraReferencePhase
기능 : 지금 화면(viewport)과 시각 프레임으로 기준 위상 정보를 만든다.
인자 : FlowViewport viewport -> 현재 React Flow 화면 값
CanvasFrame frame -> 현재 시각 프레임
반환값 : 기준 위상 정보. 프레임 크기가 유효하지 않으면 null
*/
export const getCameraReferencePhase = (
  viewport: FlowViewport,
  { width, height, insets }: CanvasFrame,
): CameraReferencePhase | null => {
  const frameWidth = width - insets.left - insets.right;
  const frameHeight = height - insets.top - insets.bottom;

  if (frameWidth <= 0 || frameHeight <= 0 || viewport.zoom <= 0) {
    return null;
  }

  const frameCenterX = insets.left + frameWidth / 2;
  const frameCenterY = insets.top + frameHeight / 2;

  return {
    center: {
      x: (frameCenterX - viewport.x) / viewport.zoom,
      y: (frameCenterY - viewport.y) / viewport.zoom,
    },
    flowWidth: frameWidth / viewport.zoom,
    flowHeight: frameHeight / viewport.zoom,
    zoom: viewport.zoom,
  };
};

/*
함수 이름 : getMinimalAxisShiftForBounds
기능 : 한 축에서 상자가 안전 구간 밖으로 삐져나간 만큼만 최소 이동 거리를 구한다.
인자 : number boundsStart -> 상자의 시작 화면 좌표
number boundsEnd -> 상자의 끝 화면 좌표
number safeStart -> 안전 구간의 시작 좌표
number safeEnd -> 안전 구간의 끝 좌표
반환값 : 상자를 안전 구간 안으로 넣기 위해 더할 화면 이동 거리
*/
const getMinimalAxisShiftForBounds = (
  boundsStart: number,
  boundsEnd: number,
  safeStart: number,
  safeEnd: number,
): number => {
  if (safeEnd <= safeStart) return 0;

  if (boundsEnd - boundsStart > safeEnd - safeStart) {
    return (safeStart + safeEnd) / 2 - (boundsStart + boundsEnd) / 2;
  }

  if (boundsStart < safeStart) {
    return safeStart - boundsStart;
  }

  if (boundsEnd > safeEnd) {
    return safeEnd - boundsEnd;
  }

  return 0;
};

type PreserveFramePhaseOptions = {
  minZoom: number; // 편집기 최소 배율
  maxZoom: number; // 편집기 최대 배율
  nodeBaseFontSizePx?: number; // 테마의 노드 기본 글자 크기(px)
  minReadableFontSizePx?: number; // 축소를 멈출 최소 화면 글자 크기(px)
  selectedNodeBounds?: FrameRect | null; // 임계치에 걸렸을 때 프레임 안에 유지할 선택 노드의 흐름 좌표 상자
};

/*
함수 이름 : getViewportCenteredInFrame
기능 : 흐름 좌표의 한 점이 주어진 배율에서 시각 프레임 가운데에 오는 화면 값을 구한다.
인자 : { x: number; y: number } center -> 가운데에 둘 흐름 좌표
number zoom -> 배율
CanvasFrame frame -> 캔버스 크기와 가려진 거리
반환값 : React Flow 화면 값
*/
export const getViewportCenteredInFrame = (
  center: { x: number; y: number },
  zoom: number,
  { width, height, insets }: CanvasFrame,
): FlowViewport => ({
  x: insets.left + (width - insets.left - insets.right) / 2 - center.x * zoom,
  y: insets.top + (height - insets.top - insets.bottom) / 2 - center.y * zoom,
  zoom,
});

/*
함수 이름 : getViewportPreservingFramePhase
기능 : 시각 프레임이 바뀌었을 때 가로·세로 중 더 많이 줄어든 축을 기준으로 배율을 조절해 원래 보던 화면(100% + @)을
새 시각 프레임 안에 담는다. 다만 글자 크기가 임계값보다 작아져야 하는 경우에는 배율 감소를 멈추고,
선택한 노드가 새 시각 프레임의 여백 안쪽에 남도록 최소 거리만 이동한다.
인자 : CameraReferencePhase reference -> 유지할 기준 위상 정보
CanvasFrame frame -> 바뀐 시각 프레임
PreserveFramePhaseOptions options -> 배율 범위, 글자 크기 기준, 선택 노드 상자
반환값 : React Flow 화면 값
*/
export const getViewportPreservingFramePhase = (
  reference: CameraReferencePhase,
  frame: CanvasFrame,
  {
    minZoom,
    maxZoom,
    nodeBaseFontSizePx = DEFAULT_NODE_FONT_SIZE_PX,
    minReadableFontSizePx = MIN_READABLE_NODE_FONT_SIZE_PX,
    selectedNodeBounds = null,
  }: PreserveFramePhaseOptions,
): FlowViewport => {
  const { width, height, insets } = frame;
  const frameWidth = width - insets.left - insets.right;
  const frameHeight = height - insets.top - insets.bottom;

  if (
    frameWidth <= 0 ||
    frameHeight <= 0 ||
    reference.flowWidth <= 0 ||
    reference.flowHeight <= 0
  ) {
    return getViewportCenteredInFrame(reference.center, reference.zoom, frame);
  }

  const idealZoom = Math.min(
    frameWidth / reference.flowWidth,
    frameHeight / reference.flowHeight,
  );
  const desiredZoom = Math.min(reference.zoom, idealZoom);
  const readableZoomLimit = minReadableFontSizePx / nodeBaseFontSizePx;
  /*
  사용자가 패널을 열기 전부터 이미 임계 글자 크기보다 작게 축소해 보고 있었다면, 패널을 열 때 오히려 확대되지 않도록 원래 배율을 하한으로 삼는다.
  */
  const minZoomFloor = Math.max(
    minZoom,
    Math.min(reference.zoom, readableZoomLimit),
  );
  const zoom = Math.min(maxZoom, Math.max(minZoomFloor, desiredZoom));
  const centeredViewport = getViewportCenteredInFrame(
    reference.center,
    zoom,
    frame,
  );

  if (desiredZoom >= zoom || !selectedNodeBounds) {
    return centeredViewport;
  }

  const safeLeft = insets.left + FRAME_MARGIN_PX;
  const safeRight = width - insets.right - FRAME_MARGIN_PX;
  const safeTop = insets.top + FRAME_MARGIN_PX;
  const safeBottom = height - insets.bottom - FRAME_MARGIN_PX;

  const shiftX = getMinimalAxisShiftForBounds(
    centeredViewport.x + selectedNodeBounds.left * zoom,
    centeredViewport.x + selectedNodeBounds.right * zoom,
    safeLeft,
    safeRight,
  );
  const shiftY = getMinimalAxisShiftForBounds(
    centeredViewport.y + selectedNodeBounds.top * zoom,
    centeredViewport.y + selectedNodeBounds.bottom * zoom,
    safeTop,
    safeBottom,
  );

  return {
    x: centeredViewport.x + shiftX,
    y: centeredViewport.y + shiftY,
    zoom,
  };
};

/*
함수 이름 : getViewportFittedInFrame
기능 : 상자가 시각 프레임 안에 들어가는 배율을 구해 상자를 프레임 가운데에 두는 화면 값을 만든다.
인자 : { left, top, right, bottom } bounds -> 맞출 상자의 흐름 좌표
CanvasFrame frame -> 캔버스 크기와 가려진 거리
{ minZoom, maxZoom } zoomRange -> 배율 범위
반환값 : React Flow 화면 값

getViewportForBounds는 캔버스 전체의 가운데에 둔 뒤 padding을 넘는 만큼만 밀어내므로, 여유가 있으면 프레임 가운데에 오지 않는다.
*/
export const getViewportFittedInFrame = (
  bounds: FrameRect,
  frame: CanvasFrame,
  { minZoom, maxZoom }: { minZoom: number; maxZoom: number },
): FlowViewport => {
  const { width, height, insets } = frame;
  const boundsWidth = bounds.right - bounds.left;
  const boundsHeight = bounds.bottom - bounds.top;
  const frameWidth = width - insets.left - insets.right - FRAME_MARGIN_PX * 2;
  const frameHeight = height - insets.top - insets.bottom - FRAME_MARGIN_PX * 2;
  const zoom = Math.min(
    maxZoom,
    Math.max(
      minZoom,
      Math.min(frameWidth / boundsWidth, frameHeight / boundsHeight),
    ),
  );

  return getViewportCenteredInFrame(
    {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
    },
    zoom,
    frame,
  );
};
