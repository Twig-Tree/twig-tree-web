import { useEffect, useEffectEvent } from "react";
import { getHiddenClientIds } from "../../lib/collapse/getHiddenClientIds";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import { useLectureStore } from "./lectureStore";

/*
함수 이름 : hasHiddenNodeChange
기능 : 접힘 집합을 바꾸면 숨겨지는 노드가 달라지는지 확인한다. 달라지지 않으면 레이아웃이 돌지 않는다.
인자 : ReadonlySet<string> nextCollapsedServerIds -> 바꿀 접힘 집합
반환값 : 숨겨지는 노드가 달라지면 true
*/
const hasHiddenNodeChange = (
  nextCollapsedServerIds: ReadonlySet<string>,
): boolean => {
  const { nodes, edges } = useTreeStore.getState();
  const { collapsedServerIds } = useCollapseStore.getState();
  const hiddenClientIds = getHiddenClientIds(nodes, edges, collapsedServerIds);
  const nextHiddenClientIds = getHiddenClientIds(
    nodes,
    edges,
    nextCollapsedServerIds,
  );

  return (
    hiddenClientIds.size !== nextHiddenClientIds.size ||
    [...hiddenClientIds].some((clientId) => !nextHiddenClientIds.has(clientId))
  );
};

/*
함수 이름 : useLectureCollapseRestore
기능 : 강의가 진행되는 동안 접힘 변경을 임시로 다루고, 강의가 끝나면 시작할 때의 접힘 상태로 되돌린다.
강의를 봤다고 사용자가 정리해 둔 트리 모양이 바뀌면 안 되기 때문이다.
인자 : () => void onBeforeRestore -> 되돌려서 보이는 노드가 달라질 때 직전에 부른다. 바뀐 배치가 끝난 뒤의 화면 이동을 맡긴다
반환값 : 없음

첫 비트가 접힘을 바꾸기 전에 임시 상태가 시작되어야 하므로, 비트를 시작하는 effect보다 먼저 호출한다.
*/
export const useLectureCollapseRestore = (onBeforeRestore: () => void) => {
  const status = useLectureStore((state) => state.status);
  const isLectureActive = status === "playing" || status === "paused";

  const notifyBeforeRestore = useEffectEvent(() => onBeforeRestore());

  useEffect(() => {
    if (!isLectureActive) return;

    useCollapseStore.getState().beginTemporaryCollapse();

    return () => {
      const { savedCollapsedServerIds, endTemporaryCollapse } =
        useCollapseStore.getState();

      /*
      보이는 노드가 그대로면 레이아웃이 돌지 않는다. 그래도 맡기면 나중의 관계없는 편집 뒤에 화면이 움직인다.
      */
      if (
        savedCollapsedServerIds !== null &&
        hasHiddenNodeChange(savedCollapsedServerIds)
      ) {
        notifyBeforeRestore();
      }

      endTemporaryCollapse();
    };
  }, [isLectureActive]);
};
