import { useEffect, useEffectEvent } from "react";
import { getCurrentLectureSegment, useLectureStore } from "./lectureStore";

type UseLectureCameraParams = {
  /*
  대상 노드의 접힌 조상을 펼치고 한 화면에 모으는 함수. useFocusNode의 revealNodes를 넘긴다.
  */
  revealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void;
};

/*
함수 이름 : useLectureCamera
기능 : 강의 구간이 바뀔 때마다 그 구간의 카메라 대상 노드로 화면을 부드럽게 옮긴다.
인자 : UseLectureCameraParams
반환값 : 없음

구간이 시작될 때 한 번만 옮긴다. 일시정지·재개나 문장이 넘어갈 때는 옮기지 않는다.
사용자가 강의 중에 화면을 끌어 다른 곳을 보고 있어도 같은 구간 안에서는 되돌리지 않기 위해서다.
*/
export const useLectureCamera = ({ revealNodes }: UseLectureCameraParams) => {
  const segment = useLectureStore(getCurrentLectureSegment);

  /*
  revealNodes는 보이는 노드가 바뀔 때마다 새 함수가 된다. effect가 이 함수에 반응하면 레이아웃이 끝날 때마다 화면이 다시 움직이므로
  effect event로 감싸 구간이 바뀔 때만 실행되게 한다.
  */
  const moveCamera = useEffectEvent(
    (clientIds: string[], maxZoom: number, duration: number) =>
      revealNodes(clientIds, { maxZoom, duration }),
  );

  /*
  구간 객체는 startLecture가 받은 배열의 원소라, 같은 구간이면 같은 객체다.
  끝난 강의를 다시 시작하면 새로 연결한 구간 배열이 들어오므로 첫 구간이어도 다시 옮긴다.
  */
  useEffect(() => {
    if (segment === null) return;

    const { targetClientIds, maxZoom, durationMs } = segment.camera;

    moveCamera(targetClientIds, maxZoom, durationMs);
  }, [segment]);
};
