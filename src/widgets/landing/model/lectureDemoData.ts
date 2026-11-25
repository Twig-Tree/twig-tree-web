/*
소개 페이지 트리 강의 데모의 예시 트리다. 좌표는 560×340 캔버스 기준이고 노드는 140×40 알약 모양이다.
*/
export const DEMO_CANVAS = { width: 560, height: 340 } as const;
export const DEMO_NODE_SIZE = { width: 140, height: 40 } as const;

export interface DemoNode {
  id: string;
  label: string;
  x: number; // 캔버스 왼쪽 위 기준 노드의 왼쪽 끝
  y: number; // 캔버스 왼쪽 위 기준 노드의 위쪽 끝
  parentId: string | null;
}

export const DEMO_NODES: DemoNode[] = [
  { id: "A", label: "운영체제", x: 20, y: 170, parentId: null },
  { id: "B", label: "프로세스", x: 210, y: 70, parentId: "A" },
  { id: "C", label: "메모리 관리", x: 210, y: 170, parentId: "A" },
  { id: "D", label: "파일 시스템", x: 210, y: 270, parentId: "A" },
  { id: "E", label: "스케줄링", x: 400, y: 20, parentId: "B" },
  { id: "F", label: "동기화", x: 400, y: 110, parentId: "B" },
  { id: "G", label: "가상 메모리", x: 400, y: 200, parentId: "C" },
];

/*
강의가 설명하는 순서다. 파일 시스템(D)은 트리에는 있지만 이 예시 강의에서는 다루지 않는다.
*/
export const DEMO_SEQUENCE = ["A", "B", "E", "F", "C", "G"] as const;

export const DEMO_NOTES: Record<(typeof DEMO_SEQUENCE)[number], string> = {
  A: "운영체제는 하드웨어와 프로그램 사이에서 자원을 관리해요. 프로세스, 메모리, 파일 시스템 세 갈래로 나눠 살펴볼게요.",
  B: "먼저 프로세스예요. 실행 중인 프로그램을 뜻하고, 운영체제는 여러 프로세스가 CPU를 나눠 쓰도록 관리해요.",
  E: "그렇다면 누가 먼저 CPU를 쓸까요? 그 규칙이 스케줄링이에요. FCFS, SJF, 라운드 로빈 같은 방식이 있어요.",
  F: "여러 프로세스가 같은 자원을 동시에 쓰면 충돌이 생겨요. 세마포어와 뮤텍스로 순서를 맞추는 것이 동기화예요.",
  C: "이제 두 번째 가지, 메모리 관리로 넘어가요. 운영체제는 프로세스마다 메모리 공간을 나눠 주고 서로 침범하지 않게 지켜요.",
  G: "가상 메모리는 실제 메모리보다 큰 공간을 쓰는 것처럼 보이게 해요. 필요한 페이지만 그때그때 메모리에 올리는 방식이에요.",
};

export const DEMO_STEP_DURATION_MS = 3600;

/*
함수 이름 : getDemoEdgePath
기능 : 부모 노드의 오른쪽 끝 중앙에서 자식 노드의 왼쪽 끝 중앙까지 이어지는 베지어 곡선 경로를 만든다.
인자 : DemoNode parent -> 부모 노드
DemoNode child -> 자식 노드
반환값 : SVG path의 d 값
*/
export const getDemoEdgePath = (parent: DemoNode, child: DemoNode): string => {
  const startX = parent.x + DEMO_NODE_SIZE.width;
  const startY = parent.y + DEMO_NODE_SIZE.height / 2;
  const endX = child.x;
  const endY = child.y + DEMO_NODE_SIZE.height / 2;
  const middleX = (startX + endX) / 2;

  return `M${startX} ${startY} C${middleX} ${startY} ${middleX} ${endY} ${endX} ${endY}`;
};
