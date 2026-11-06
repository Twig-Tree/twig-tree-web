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

type CanvasFrame = {
  width: number; // 캔버스 너비
  height: number; // 캔버스 높이
  insets: CameraFrameInsets; // 네 방향에서 가려진 거리
};

type FlowViewport = { x: number; y: number; zoom: number };

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
