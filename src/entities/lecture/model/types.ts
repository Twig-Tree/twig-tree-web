/*
데모 강의가 지금 트리에서 노드를 찾을 때 쓰는 루트부터의 이름 경로. 대본 자체는 LectureNodeId로만 노드를 가리킨다.
*/
export type LectureNodePath = string[];

/*
강의가 가리키는 서버 노드 ID. 지금은 프론트 데모가 이 값을 만들고,
강의 API가 생기면 같은 계약으로 서버 응답을 받는다.
*/
export type LectureNodeId = string;

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
  style: "steady" | "pulse" | "pop" | "bounce" | "shake";
  tone?: "accent" | "success" | "warning" | "danger";
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
  mode?: "simultaneous" | "progressive";
  direction?: "forward" | "reverse";
  style?: "dash" | "comet"; // dash(기본): 흐르는 점선. comet: 선을 그린 뒤 빛 점이 선을 따라 달린다
  persist?: boolean;
}

/*
노드 옆에 짧은 꼬리표(①, 핵심, 정답)를 띄운다. 한 노드에 꼬리표가 여럿 겹치면 나중에 붙인 것이 보인다.
*/
export interface LectureBadgeAction {
  type: "badge";
  targetNodeIds: LectureNodeId[]; // 꼬리표를 붙일 노드
  label: string; // 꼬리표 글자. 비어 있으면 안 되고 MAX_LECTURE_BADGE_LABEL_LENGTH를 넘지 않는다
  tone?: "accent" | "success" | "warning" | "danger";
  durationMs: number;
  persist?: boolean; // true이면 다음 reset 전까지 꼬리표를 유지한다
}

export interface LectureWaitAction {
  type: "wait";
  durationMs: number;
}

/*
접고 펼치는 움직임은 편집기의 노드 전환이 그리므로 시간은 정해져 있다. durationMs는 다음 동작까지 기다리는 시간이다.
*/
export interface LectureCollapseAction {
  type: "collapse";
  targetNodeIds: LectureNodeId[]; // 자식을 접을 노드. 자식이 없는 노드는 건너뛴다
  durationMs: number;
}

export interface LectureExpandAction {
  type: "expand";
  targetNodeIds: LectureNodeId[]; // 자식을 펼칠 노드. 접힌 조상도 함께 펼쳐 항상 화면에 드러난다
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
  | LectureBadgeAction
  | LectureWaitAction
  | LectureCollapseAction
  | LectureExpandAction
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
비트 하나가 음성·자막·연출의 동기화 경계다. animation을 먼저 시작하고, narration과 animation이 모두 끝나면 다음 비트로 넘어간다.
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
강의 대본. 장면과 비트로 구성하며 플레이어는 이 형식만 재생한다.
*/
export interface LectureScript {
  id: string;
  title: string;
  scenes: LectureScene[];
}
