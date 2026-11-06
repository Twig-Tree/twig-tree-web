import { createDemoLecture } from "./createDemoLecture";
import { type LectureAnimation, type LectureNodePath } from "./types";

const ROOT = "컴퓨터 사이언스";
const DATA_STRUCTURE = "자료구조";
const ALGORITHM = "알고리즘";

const NO_ANIMATION: LectureAnimation = {
  type: "group",
  mode: "sequence",
  children: [],
};

/*
아래 구조의 트리에서 재생되는 데모 강의. 백엔드 개발용 시나리오(POST /tree-request?mock=small)와 같은 구조지만,
그 응답은 DB에 저장되지 않으므로 트리는 편집기에서 직접 만든다.

컴퓨터 사이언스
├─ 자료구조
│  ├─ 배열
│  └─ 스택
└─ 알고리즘
   └─ 정렬

fallbackDurationMs는 한국어 음성 합성의 보통 속도로 어림한 값이다. 음성이 있으면 문장이 끝나는 이벤트로 넘어가므로 쓰이지 않는다.
*/
const NODE_PATHS = {
  root: [ROOT],
  dataStructure: [ROOT, DATA_STRUCTURE],
  array: [ROOT, DATA_STRUCTURE, "배열"],
  stack: [ROOT, DATA_STRUCTURE, "스택"],
  algorithm: [ROOT, ALGORITHM],
  sort: [ROOT, ALGORITHM, "정렬"],
} satisfies Record<string, LectureNodePath>;

export const COMPUTER_SCIENCE_DEMO_LECTURE = createDemoLecture(
  NODE_PATHS,
  (nodeIds) => ({
    id: "demo-computer-science",
    title: "컴퓨터 사이언스 기초",
    scenes: [
      {
        id: "intro",
        nodeId: nodeIds.root,
        beats: [
          {
            id: "intro-1",
            narration: {
              text: "컴퓨터 사이언스 기초 강의를 시작하겠습니다.",
              fallbackDurationMs: 3200,
            },
            animation: {
              type: "focus",
              targetNodeIds: [
                nodeIds.root,
                nodeIds.dataStructure,
                nodeIds.algorithm,
              ],
              maxZoom: 1,
              durationMs: 800,
            },
          },
          {
            id: "intro-2",
            narration: {
              text: "이 트리는 자료구조와 알고리즘, 두 갈래로 나뉘어 있습니다.",
              fallbackDurationMs: 4400,
            },
            animation: NO_ANIMATION,
          },
          {
            id: "intro-3",
            narration: {
              text: "먼저 데이터를 담는 방법부터 살펴보겠습니다.",
              fallbackDurationMs: 3400,
            },
            animation: NO_ANIMATION,
          },
        ],
      },
      {
        id: "data-structure",
        nodeId: nodeIds.dataStructure,
        beats: [
          {
            id: "data-structure-1",
            narration: {
              text: "자료구조는 데이터를 조직하고 저장하는 방법입니다.",
              fallbackDurationMs: 3800,
            },
            animation: {
              type: "focus",
              targetNodeIds: [
                nodeIds.dataStructure,
                nodeIds.array,
                nodeIds.stack,
              ],
              maxZoom: 1.2,
              durationMs: 800,
            },
          },
          {
            id: "data-structure-2",
            narration: {
              text: "어떤 구조를 고르느냐에 따라 같은 작업의 속도가 달라집니다.",
              fallbackDurationMs: 4200,
            },
            animation: NO_ANIMATION,
          },
          {
            id: "data-structure-3",
            narration: {
              text: "대표적인 예로 배열과 스택이 있습니다.",
              fallbackDurationMs: 3200,
            },
            animation: NO_ANIMATION,
          },
        ],
      },
      {
        id: "array",
        nodeId: nodeIds.array,
        beats: [
          {
            id: "array-1",
            narration: {
              text: "배열은 연속된 메모리 공간에 값을 나란히 담습니다.",
              fallbackDurationMs: 3600,
            },
            animation: {
              type: "focus",
              targetNodeIds: [nodeIds.array],
              maxZoom: 1.4,
              durationMs: 700,
            },
          },
          {
            id: "array-2",
            narration: {
              text: "번호만 알면 원하는 위치의 값을 바로 꺼낼 수 있습니다.",
              fallbackDurationMs: 3800,
            },
            animation: NO_ANIMATION,
          },
        ],
      },
      {
        id: "stack",
        nodeId: nodeIds.stack,
        beats: [
          {
            id: "stack-1",
            narration: {
              text: "스택은 마지막에 넣은 값을 가장 먼저 꺼내는 구조입니다.",
              fallbackDurationMs: 3800,
            },
            animation: {
              type: "focus",
              targetNodeIds: [nodeIds.stack],
              maxZoom: 1.4,
              durationMs: 700,
            },
          },
          {
            id: "stack-2",
            narration: {
              text: "접시를 쌓고 맨 위부터 꺼내는 모습을 떠올리면 쉽습니다.",
              fallbackDurationMs: 4000,
            },
            animation: NO_ANIMATION,
          },
        ],
      },
      {
        id: "algorithm",
        nodeId: nodeIds.algorithm,
        beats: [
          {
            id: "algorithm-1",
            narration: {
              text: "알고리즘은 문제를 푸는 절차를 정리한 것입니다.",
              fallbackDurationMs: 3600,
            },
            animation: {
              type: "focus",
              targetNodeIds: [nodeIds.algorithm, nodeIds.sort],
              maxZoom: 1.2,
              durationMs: 800,
            },
          },
          {
            id: "algorithm-2",
            narration: {
              text: "정렬은 값을 정해진 순서로 늘어놓는 대표적인 알고리즘입니다.",
              fallbackDurationMs: 4200,
            },
            animation: NO_ANIMATION,
          },
          {
            id: "algorithm-3",
            narration: {
              text: "이것으로 오늘 강의를 마치겠습니다.",
              fallbackDurationMs: 2600,
            },
            animation: NO_ANIMATION,
          },
        ],
      },
    ],
  }),
);
