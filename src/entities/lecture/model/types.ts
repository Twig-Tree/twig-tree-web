/*
기존 구간 강의가 사용하는 루트 노드부터 대상 노드까지의 이름 경로.
동적 LectureScript는 아래 LectureNodeId를 사용한다.
*/
export type LectureNodePath = string[];

/*
동적 강의가 가리키는 서버 노드 ID. 지금은 프론트 목데이터가 이 값을 제공하고,
강의 API가 생기면 같은 계약으로 서버 응답을 받는다.
*/
export type LectureNodeId = string;

/*
문장 하나의 자막. 시각은 구간 시작으로부터의 밀리초다.
음성 합성은 문장이 끝나는 시점을 이벤트로 알려 주므로 시각은 음성이 없을 때 자막만 넘길 때 쓴다.
*/
export interface LectureSubtitle {
  startMs: number;
  endMs: number;
  text: string;
}

/*
구간이 시작될 때 화면에 함께 담을 노드와 이동 방식.
*/
export interface LectureCamera {
  targetNodePaths: LectureNodePath[]; // 한 화면에 모을 노드. 설명 노드와 그 하위 개념을 함께 담는다
  maxZoom: number; // 대상이 적어도 이 배율을 넘겨 확대하지 않는다
  durationMs: number; // 화면 이동 애니메이션 시간
}

/*
강의 구간 하나. 노드 하나를 설명한다.
대본은 문장 단위 자막을 순서대로 이은 것이라 따로 두지 않는다. 같은 문장을 두 곳에 두면 서로 어긋날 수 있다.
*/
export interface LectureSegment {
  id: string;
  nodePath: LectureNodePath; // 이 구간이 설명하는 노드
  subtitles: LectureSubtitle[];
  camera: LectureCamera;
}

export interface Lecture {
  id: string;
  title: string;
  segments: LectureSegment[];
}

/*
LLM이 생성하고 플레이어가 읽는 문장 하나. 실제 음성이 없을 때만 fallbackDurationMs를 재생 시간으로 쓴다.
*/
export interface LectureNarration {
  text: string;
  fallbackDurationMs: number;
}

export interface LectureFocusAction {
  type: "focus";
  targetNodeIds: LectureNodeId[]; // 한 화면에 모을 노드
  maxZoom: number;
  durationMs: number;
}

export interface LectureHighlightAction {
  type: "highlight";
  targetNodeIds: LectureNodeId[];
  style: "steady" | "pulse";
  durationMs: number;
  persist?: boolean; // true이면 다음 reset 전까지 강조를 유지한다
}

export interface LectureDimAction {
  type: "dim";
  exceptNodeIds: LectureNodeId[]; // 흐리지 않고 남겨 둘 노드
  durationMs: number;
  persist?: boolean; // true이면 다음 reset 전까지 흐림을 유지한다
}

export interface LectureTraceAction {
  type: "trace";
  nodeIds: LectureNodeId[]; // 연결선을 따라갈 순서로 나열한 노드
  durationMs: number;
}

export interface LectureResetAction {
  type: "reset";
  scope: "visual" | "camera" | "all";
}

export type LectureAnimationAction =
  | LectureFocusAction
  | LectureHighlightAction
  | LectureDimAction
  | LectureTraceAction
  | LectureResetAction;

/*
그룹은 원자 동작과 다른 그룹을 재귀적으로 묶는다. LLM은 이 구조만 조합하고 임의의 실행 코드는 만들지 않는다.
*/
export interface LectureAnimationGroup {
  type: "group";
  mode: "sequence" | "parallel";
  children: LectureAnimation[];
}

export type LectureAnimation = LectureAnimationAction | LectureAnimationGroup;

/*
비트 하나가 음성·자막·연출의 동기화 경계다. animation을 먼저 시작하고 narration이 끝나면 다음 비트로 넘어간다.
*/
export interface LectureBeat {
  id: string;
  narration: LectureNarration;
  animation: LectureAnimation;
}

/*
장면은 하나의 중심 노드를 설명하는 연속된 비트다.
*/
export interface LectureScene {
  id: string;
  nodeId: LectureNodeId;
  beats: LectureBeat[];
}

/*
기존 Lecture 플레이어를 새 실행기로 옮기는 동안 병행해서 쓰는 동적 강의 계약이다.
*/
export interface LectureScript {
  id: string;
  title: string;
  scenes: LectureScene[];
}
