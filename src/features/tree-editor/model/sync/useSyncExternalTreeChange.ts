import { useEffect, useRef } from "react";
import { focusManager } from "@tanstack/react-query";
import { useTreeRequestTracker } from "@/src/entities/tree";
import { isSameTreeNodes } from "../../lib/sync/isSameTreeNodes";
import { useTreeStore } from "../treeStore";
import { useExternalChangeCheckStore } from "./externalChangeCheckStore";
import { useApplyServerTree } from "./useApplyServerTree";
import { useIsEditingTree } from "./useIsEditingTree";

type UseSyncExternalTreeChangeParams = {
  treeId: string | null; // 열려 있는 트리 ID. 트리가 없는 워크스페이스는 null
  isStructureEditing: boolean; // 구조 편집이나 강의 재생처럼 트리를 바꾸면 안 되는 페이지 상태인지
  onSelectedNodeRemoved: () => void; // 선택했던 노드가 서버에서 사라졌을 때 페이지가 할 일
};

const doNothing = () => {};

/*
함수 이름 : useSyncExternalTreeChange
기능 : 탭으로 돌아오거나 저장이 거절되면 트리를 다시 조회해 다른 곳의 변경을 찾고, 편집 중이 아닐 때 편집기에 반영한다.
인자 : UseSyncExternalTreeChangeParams
반환값 : 없음

비교는 이 hook이 직접 다시 조회한 결과만 한다. 캐시는 서버 응답으로만 갱신되므로, 이 탭의 삭제 뒤 무효화 재조회까지 비교하면 자기 변경을 외부 변경으로 오판한다.
*/
export const useSyncExternalTreeChange = ({
  treeId,
  isStructureEditing,
  onSelectedNodeRemoved,
}: UseSyncExternalTreeChangeParams) => {
  const {
    isRequestActive,
    getCachedTree,
    hasActiveRequest,
    refetchTree,
    subscribeMutationStart,
  } = useTreeRequestTracker(treeId);
  const isEditing = useIsEditingTree({ isStructureEditing });
  const applyServerTree = useApplyServerTree({ onSelectedNodeRemoved });
  const checkRequestCount = useExternalChangeCheckStore(
    (state) => state.requestCount,
  );

  /*
  조회 응답을 기다리는 동안 값이 바뀌므로, 비동기 흐름에서는 렌더 시점의 값 대신 이 최신 값을 읽는다.
  */
  const latestRef = useRef({
    isEditing,
    isStructureEditing,
    applyServerTree,
  });

  useEffect(() => {
    latestRef.current = { isEditing, isStructureEditing, applyServerTree };
  });

  const settleRef = useRef(doNothing);
  const checkRef = useRef(doNothing);

  useEffect(() => {
    if (treeId === null) return;

    let isDisposed = false;
    let isChecking = false;
    let needsRecheck = false; // 이 탭의 요청과 겹쳐 비교를 건너뛴 뒤 다시 확인해야 하는지
    let hasPendingChange = false; // 다른 곳의 변경을 찾았지만 아직 편집기에 반영하지 못했는지

    const isBusy = () =>
      isChecking || hasActiveRequest() || latestRef.current.isStructureEditing;

    /*
    요청이 모두 끝난 시점에 밀린 일을 처리한다. 다시 확인이 먼저다. 재확인이 끝나면 다시 여기로 온다.
    반영할 값은 찾았을 때의 응답이 아니라 지금의 캐시를 읽는다. 미루는 동안 저장한 이 탭의 편집이 캐시에는 들어 있다.
    */
    const settle = () => {
      if (isDisposed || isBusy()) return;

      if (needsRecheck) {
        needsRecheck = false;
        check();
        return;
      }

      if (!hasPendingChange || latestRef.current.isEditing) return;
      if (useTreeStore.getState().treeId !== treeId) return; // 편집기가 아직 이 트리로 채워지기 전이다.

      const latestNodes = getCachedTree();

      if (!latestNodes) return;

      hasPendingChange = false;
      latestRef.current.applyServerTree(latestNodes);
    };

    /*
    재조회 직전의 캐시와 결과를 비교한다. 재조회 중에 이 탭의 mutation이 시작되면 응답 순서가 엇갈릴 수 있어 비교를 버리고, 요청이 끝난 뒤 한 번 더 확인한다.
    */
    const runCheck = async () => {
      const previousNodes = getCachedTree();

      if (!previousNodes) return;

      let hasOverlappedMutation = false;
      const unsubscribe = subscribeMutationStart(() => {
        hasOverlappedMutation = true;
      });

      isChecking = true;

      try {
        await refetchTree();
      } catch {
        return; // 조회에 실패하면 비교할 값이 없다. 다음 포커스 때 다시 확인한다.
      } finally {
        isChecking = false;
        unsubscribe();
      }

      if (hasOverlappedMutation) {
        needsRecheck = true;
      } else {
        const latestNodes = getCachedTree();

        if (latestNodes && !isSameTreeNodes(previousNodes, latestNodes)) {
          hasPendingChange = true;
        }
      }

      settle();
    };

    const check = () => {
      if (isDisposed) return;

      if (isBusy()) {
        needsRecheck = true;
        return;
      }

      void runCheck();
    };

    settleRef.current = settle;
    checkRef.current = check;

    /*
    focusManager는 visibilitychange로만 포커스를 판단하므로 탭 전환에서만 불린다. 숨겨질 때의 호출은 건너뛴다.
    */
    const unsubscribeFocus = focusManager.subscribe((isFocused) => {
      if (isFocused) check();
    });

    return () => {
      isDisposed = true;
      settleRef.current = doNothing;
      checkRef.current = doNothing;
      unsubscribeFocus();
    };
  }, [
    treeId,
    getCachedTree,
    hasActiveRequest,
    refetchTree,
    subscribeMutationStart,
  ]);

  /*
  요청과 편집이 끝나는 순간 밀린 일을 처리한다. 끝나지 않았으면 settle이 아무것도 하지 않는다.
  */
  useEffect(() => {
    if (!isRequestActive) settleRef.current();
  }, [isRequestActive, isEditing, isStructureEditing]);

  useEffect(() => {
    if (checkRequestCount > 0) checkRef.current();
  }, [checkRequestCount]);
};
