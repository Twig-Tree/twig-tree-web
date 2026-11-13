import { useCallback, useEffect, useRef, useState } from "react";

/*
노드에서 버튼으로 마우스를 옮기는 동안 둘 사이의 틈을 지나므로, 노드를 벗어나자마자 지우면 버튼에 닿기 전에 사라진다.
이 시간 안에 노드나 버튼에 다시 들어오면 그대로 둔다.
*/
const HOVER_LEAVE_DELAY_MS = 200;

/*
함수 이름 : useHoveredNode
기능 : 마우스가 올라간 노드를 기억한다. 노드를 벗어나도 잠깐 기다렸다가 지워, 노드 옆 버튼으로 마우스를 옮길 수 있게 한다.
인자 : 없음
반환값 : 마우스가 올라간 노드 ID, 노드·버튼에 들어오고 나갈 때 부를 함수
*/
export function useHoveredNode() {
  const [hoveredClientId, setHoveredClientId] = useState<string | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLeave = useCallback(() => {
    if (leaveTimerRef.current === null) return;

    clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = null;
  }, []);

  const enterNode = useCallback(
    (clientId: string) => {
      cancelLeave();
      setHoveredClientId(clientId);
    },
    [cancelLeave],
  );

  const scheduleLeave = useCallback(() => {
    cancelLeave();
    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = null;
      setHoveredClientId(null);
    }, HOVER_LEAVE_DELAY_MS);
  }, [cancelLeave]);

  useEffect(() => cancelLeave, [cancelLeave]); // 화면을 벗어난 뒤 타이머가 state를 바꾸지 않게 한다

  return {
    hoveredClientId,
    enterNode,
    leaveNode: scheduleLeave,
    enterToolbar: cancelLeave,
    leaveToolbar: scheduleLeave,
  };
}
