import { Lecture } from "./types";

const ROOT = "컴퓨터 사이언스";
const DATA_STRUCTURE = "자료구조";
const ALGORITHM = "알고리즘";

/*
서버 없이 강의 재생을 확인하기 위한 데모 강의.
백엔드 고정 트리(POST /tree-request?mock=small)의 노드 이름 경로에 맞춰 두었다.

컴퓨터 사이언스
├─ 자료구조
│  ├─ 배열
│  └─ 스택
└─ 알고리즘
   └─ 정렬

자막 시각은 한국어 음성 합성의 보통 속도로 어림한 값이다. 음성이 있으면 문장이 끝나는 이벤트로 넘어가므로 쓰이지 않는다.
*/
export const DEMO_LECTURE: Lecture = {
  id: "demo-computer-science",
  title: "컴퓨터 사이언스 기초",
  segments: [
    {
      id: "intro",
      nodePath: [ROOT],
      subtitles: [
        {
          startMs: 0,
          endMs: 3200,
          text: "컴퓨터 사이언스 기초 강의를 시작하겠습니다.",
        },
        {
          startMs: 3200,
          endMs: 7600,
          text: "이 트리는 자료구조와 알고리즘, 두 갈래로 나뉘어 있습니다.",
        },
        {
          startMs: 7600,
          endMs: 11000,
          text: "먼저 데이터를 담는 방법부터 살펴보겠습니다.",
        },
      ],
      camera: {
        targetNodePaths: [[ROOT], [ROOT, DATA_STRUCTURE], [ROOT, ALGORITHM]],
        maxZoom: 1,
        durationMs: 800,
      },
    },
    {
      id: "data-structure",
      nodePath: [ROOT, DATA_STRUCTURE],
      subtitles: [
        {
          startMs: 0,
          endMs: 3800,
          text: "자료구조는 데이터를 조직하고 저장하는 방법입니다.",
        },
        {
          startMs: 3800,
          endMs: 8000,
          text: "어떤 구조를 고르느냐에 따라 같은 작업의 속도가 달라집니다.",
        },
        {
          startMs: 8000,
          endMs: 11200,
          text: "대표적인 예로 배열과 스택이 있습니다.",
        },
      ],
      camera: {
        targetNodePaths: [
          [ROOT, DATA_STRUCTURE],
          [ROOT, DATA_STRUCTURE, "배열"],
          [ROOT, DATA_STRUCTURE, "스택"],
        ],
        maxZoom: 1.2,
        durationMs: 800,
      },
    },
    {
      id: "array",
      nodePath: [ROOT, DATA_STRUCTURE, "배열"],
      subtitles: [
        {
          startMs: 0,
          endMs: 3600,
          text: "배열은 연속된 메모리 공간에 값을 나란히 담습니다.",
        },
        {
          startMs: 3600,
          endMs: 7400,
          text: "번호만 알면 원하는 위치의 값을 바로 꺼낼 수 있습니다.",
        },
      ],
      camera: {
        targetNodePaths: [[ROOT, DATA_STRUCTURE, "배열"]],
        maxZoom: 1.4,
        durationMs: 700,
      },
    },
    {
      id: "stack",
      nodePath: [ROOT, DATA_STRUCTURE, "스택"],
      subtitles: [
        {
          startMs: 0,
          endMs: 3800,
          text: "스택은 마지막에 넣은 값을 가장 먼저 꺼내는 구조입니다.",
        },
        {
          startMs: 3800,
          endMs: 7800,
          text: "접시를 쌓고 맨 위부터 꺼내는 모습을 떠올리면 쉽습니다.",
        },
      ],
      camera: {
        targetNodePaths: [[ROOT, DATA_STRUCTURE, "스택"]],
        maxZoom: 1.4,
        durationMs: 700,
      },
    },
    {
      id: "algorithm",
      nodePath: [ROOT, ALGORITHM],
      subtitles: [
        {
          startMs: 0,
          endMs: 3600,
          text: "알고리즘은 문제를 푸는 절차를 정리한 것입니다.",
        },
        {
          startMs: 3600,
          endMs: 7800,
          text: "정렬은 값을 정해진 순서로 늘어놓는 대표적인 알고리즘입니다.",
        },
        {
          startMs: 7800,
          endMs: 10400,
          text: "이것으로 오늘 강의를 마치겠습니다.",
        },
      ],
      camera: {
        targetNodePaths: [
          [ROOT, ALGORITHM],
          [ROOT, ALGORITHM, "정렬"],
        ],
        maxZoom: 1.2,
        durationMs: 800,
      },
    },
  ],
};
