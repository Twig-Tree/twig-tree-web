const lastSaveByClientId = new Map<string, Promise<void>>(); // 노드별로 마지막에 맡긴 저장이 끝나는 시점

/*
함수 이름 : runNodeSaveInOrder
기능 : 같은 노드의 이름·메모 저장을 맡긴 순서대로 하나씩 실행한다. 두 저장은 노드의 version을 함께 쓰므로, 겹쳐서 나가면
같은 version을 보낸 뒤쪽 요청이 자기 탭의 앞 요청과 충돌한다. 이름 입력 중 메모 저장을 누르면 blur 저장과 클릭 저장이 연달아 나가 실제로 겹친다.
앞 저장의 성패와 상관없이 다음 저장을 실행한다. 저장 함수는 실행될 때 store에서 version을 읽어야 앞 저장이 올린 값을 쓴다.
인자 : string clientId -> 저장할 노드의 편집기 노드 ID
() => Promise<T> save -> 차례가 되면 실행할 저장 함수
반환값 : 저장 함수의 결과
*/
export const runNodeSaveInOrder = <T>(
  clientId: string,
  save: () => Promise<T>,
): Promise<T> => {
  const previousSave = lastSaveByClientId.get(clientId) ?? Promise.resolve();
  const currentSave = previousSave.then(save);

  /*
  실패가 다음 저장으로 번지지 않도록 끝나는 시점만 기록한다. 결과와 오류는 currentSave로 호출부가 받는다.
  */
  const settled: Promise<void> = currentSave.then(
    () => undefined,
    () => undefined,
  );

  lastSaveByClientId.set(clientId, settled);

  /*
  뒤이어 맡긴 저장이 없을 때만 지운다. 노드 수만큼 기록이 쌓이지 않게 한다.
  */
  void settled.then(() => {
    if (lastSaveByClientId.get(clientId) === settled) {
      lastSaveByClientId.delete(clientId);
    }
  });

  return currentSave;
};
