import { useCallback, useEffect, useRef } from "react";
import { useLectureStore } from "./lectureStore";

/*
함수 이름 : useLectureCameraRefit
기능 : 강의의 마지막 카메라 동작을 기억했다가, 강의 중에 패널이 열리거나 닫혀 시각 프레임이 바뀌면 다시 실행한다.
설명 중인 노드가 패널에 가리거나 프레임 한쪽으로 치우치지 않게 하기 위해서다. 강의 중이 아니면 사용자가 보던 지점을 잃지 않도록 움직이지 않는다.
인자 : string panelLayoutKey -> 패널 배치를 나타내는 값. 바뀌면 패널이 열리거나 닫힌 것으로 본다
반환값 : 카메라 동작을 실행하고 기억하는 함수

자막 때문에 플레이어 높이가 바뀌는 것은 패널 배치에 들어가지 않는다. 비트마다 화면이 흔들리므로 다음 카메라 동작 때 반영한다.
*/
export const useLectureCameraRefit = (panelLayoutKey: string) => {
  const lastCameraMoveRef = useRef<(() => void) | null>(null);
  const previousPanelLayoutKeyRef = useRef(panelLayoutKey);

  const runCameraMove = useCallback((cameraMove: () => void) => {
    lastCameraMoveRef.current = cameraMove;
    cameraMove();
  }, []);

  useEffect(() => {
    if (previousPanelLayoutKeyRef.current === panelLayoutKey) return;

    previousPanelLayoutKeyRef.current = panelLayoutKey;

    const { status } = useLectureStore.getState();

    if (status === "playing" || status === "paused") {
      lastCameraMoveRef.current?.();
    }
  }, [panelLayoutKey]);

  /*
  끝난 강의의 동작이 다음 강의의 첫 카메라 동작 전에 다시 실행되지 않도록 지운다.
  */
  const status = useLectureStore((state) => state.status);

  useEffect(() => {
    if (status === "idle" || status === "ended") {
      lastCameraMoveRef.current = null;
    }
  }, [status]);

  return runCameraMove;
};
