import { useCallback, useState } from "react";
import { useMediaQuery } from "@/src/shared/lib/react/useMediaQuery";

/*
이 폭보다 좁으면 패널이 캔버스를 너무 많이 가리므로 닫아 두고, 열 때는 캔버스 위에 겹쳐 띄운다.
Tailwind의 lg 기준(1024px)과 맞춘다.
*/
const NARROW_SCREEN_QUERY = "(max-width: 1023px)";

type UseResponsivePanelVisibilityParams = {
  /*
  넓은 화면에서 처음부터 열어 두고, 화면이 다시 넓어지면 다시 열지.
  메모 패널처럼 고른 노드가 있어야 의미가 있는 패널은 false로 두어 사용자가 열 때만 연다.
  */
  isOpenOnWideScreen: boolean;
};

/*
함수 이름 : useResponsivePanelVisibility
기능 : 캔버스 옆 패널의 열림 상태를 관리한다. 화면이 좁아지면 자동으로 닫고, 다시 넓어지면 설정에 따라 연다.
그 사이에는 사용자가 직접 열고 닫은 상태를 따른다.
인자 : UseResponsivePanelVisibilityParams
반환값 : 패널이 열렸는지, 캔버스 위에 겹쳐 띄울지, 패널을 여는 함수와 닫는 함수
*/
export function useResponsivePanelVisibility({
  isOpenOnWideScreen,
}: UseResponsivePanelVisibilityParams) {
  const isNarrowScreen = useMediaQuery(NARROW_SCREEN_QUERY);

  const [isPanelOpen, setIsPanelOpen] = useState(isOpenOnWideScreen);
  const [prevIsNarrowScreen, setPrevIsNarrowScreen] = useState(false);

  /*
  화면 폭이 기준을 넘나드는 순간에만 열림 상태를 바꾼다. effect에서 바꾸면 넓은 화면의 패널이
  한 번 그려졌다가 닫히므로, 렌더 중에 이전 값과 비교해 바로 맞춘다.
  */
  if (isNarrowScreen !== prevIsNarrowScreen) {
    setPrevIsNarrowScreen(isNarrowScreen);

    if (isNarrowScreen) setIsPanelOpen(false);
    else if (isOpenOnWideScreen) setIsPanelOpen(true);
  }

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  return {
    isPanelOpen,
    isPanelOverlay: isNarrowScreen,
    openPanel,
    closePanel,
  };
}
