/*
함수 이름 : createClientNodeId
기능 : 편집기 안에서만 통하는 노드 신원을 만든다. 생성 시점에 정해져 세션 동안 바뀌지 않으므로,
서버 응답이 도착해도 노드 ID를 교체할 일이 없고 그로 인한 레이아웃 재계산도 생기지 않는다.
인자 : 없음
반환값 : 편집기 노드 ID
*/
export const createClientNodeId = (): string => crypto.randomUUID();
