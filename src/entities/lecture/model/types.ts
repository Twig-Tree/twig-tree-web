/*
루트 노드부터 대상 노드까지의 노드 이름 경로.
노드 ID는 트리를 만들 때마다 서버가 새로 부여하므로 목데이터는 ID 대신 이름 경로로 노드를 가리킨다.
서버가 강의를 내려주게 되면 이 자리는 노드 ID로 바뀐다.
*/
export type LectureNodePath = string[];

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
