import { createDemoLecture, type DemoTreeNode } from "./createDemoLecture";
import { type LectureNodeId, type LectureNodePath } from "./types";

const ROOT = "컴퓨터 사이언스";
const DATA_STRUCTURE = "자료구조";
const ALGORITHM = "알고리즘";
const OPERATING_SYSTEM = "운영체제";
const ARRAY = "배열";
const STACK = "스택";
const TREE = "트리";
const BINARY_SEARCH_TREE = "이진 탐색 트리";
const HEAP = "힙";
const SORT = "정렬";
const SEARCH = "탐색";
const QUICK_SORT = "퀵 정렬";
const PROCESS = "프로세스";
const MEMORY = "메모리";

/*
DB에 만들 트리의 원본. 애니메이션 랩의 고정 트리(widgets/animation-lab/model/fixtureTree.ts)와 같은 구조라
랩과 편집기에서 같은 화면을 녹화할 수 있다.
*/
export const SHOWCASE_DEMO_TREE: DemoTreeNode = {
  name: ROOT,
  children: [
    {
      name: DATA_STRUCTURE,
      children: [
        { name: ARRAY },
        { name: STACK },
        {
          name: TREE,
          children: [{ name: BINARY_SEARCH_TREE }, { name: HEAP }],
        },
      ],
    },
    {
      name: ALGORITHM,
      children: [
        { name: SORT, children: [{ name: QUICK_SORT }] },
        { name: SEARCH },
      ],
    },
    {
      name: OPERATING_SYSTEM,
      children: [{ name: PROCESS }, { name: MEMORY }],
    },
  ],
};

const NODE_PATHS = {
  root: [ROOT],
  dataStructure: [ROOT, DATA_STRUCTURE],
  algorithm: [ROOT, ALGORITHM],
  operatingSystem: [ROOT, OPERATING_SYSTEM],
  array: [ROOT, DATA_STRUCTURE, ARRAY],
  stack: [ROOT, DATA_STRUCTURE, STACK],
  tree: [ROOT, DATA_STRUCTURE, TREE],
  binarySearchTree: [ROOT, DATA_STRUCTURE, TREE, BINARY_SEARCH_TREE],
  heap: [ROOT, DATA_STRUCTURE, TREE, HEAP],
  sort: [ROOT, ALGORITHM, SORT],
  search: [ROOT, ALGORITHM, SEARCH],
  quickSort: [ROOT, ALGORITHM, SORT, QUICK_SORT],
  process: [ROOT, OPERATING_SYSTEM, PROCESS],
  memory: [ROOT, OPERATING_SYSTEM, MEMORY],
} satisfies Record<string, LectureNodePath>;

type ShowcaseNodeKey = keyof typeof NODE_PATHS;

const BRANCH_BADGE_MS = 900; // 갈래 하나에 번호를 붙이고 다음 갈래로 넘어가기까지의 시간

/*
발표 시연용 강의. 보편적인 컴퓨터 사이언스 해설을 따라가면서 강의 연출을 모두 한 번씩 보여 준다.
- 시작: 전체 개념이 나타나고(grow), 컴퓨터 사이언스의 공통 목표를 강조한다(pulse)
- 핵심 영역: 세 분야를 차례로 소개하며(pop) 번호 꼬리표(badge)를 붙인다
- 자료구조: 관련 개념만 남기고(dim) 트리에서 힙으로 이어지는 포함 관계를 따라간다(trace comet)
- 퀴즈: 오답은 흔들고(shake) 정답은 반짝인 뒤(sparkle), 퀵 정렬까지 연결한다(trace comet)
- 마무리: 힙에서 컴퓨터 사이언스까지 개념의 포함 관계를 거슬러 올라가고 루트를 강조한다

같은 루트 이름의 컴퓨터 사이언스 데모보다 노드가 많아, 이 트리의 노드가 모두 있을 때만 연결된다.
그래서 DEMO_LECTURES에서 그 데모보다 앞에 둔다.
각 비트의 애니메이션은 fallbackDurationMs 안에 끝나도록 구성했다.
*/
export const SHOWCASE_DEMO_LECTURE = createDemoLecture(
  NODE_PATHS,
  (nodeIds) => {
    const pick = (...keys: ShowcaseNodeKey[]): LectureNodeId[] =>
      keys.map((key) => nodeIds[key]);
    const allNodeIds = Object.values(nodeIds);
    const deepPath = pick("root", "dataStructure", "tree", "heap");

    return {
      id: "demo-showcase",
      title: "한눈에 보는 컴퓨터 사이언스",
      scenes: [
        {
          id: "showcase-intro",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "showcase-intro-grow",
              narration: {
                text: "컴퓨터 사이언스는 정보를 어떻게 저장하고 처리할지 연구합니다. 먼저 전체 구성을 살펴보겠습니다.",
                fallbackDurationMs: 5000,
              },
              animation: {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "focus",
                    targetNodeIds: allNodeIds,
                    maxZoom: 1,
                    durationMs: 800,
                  },
                  {
                    type: "grow",
                    targetNodeIds: [nodeIds.root],
                    durationMs: 3200,
                  },
                ],
              },
            },
            {
              id: "showcase-intro-root",
              narration: {
                text: "그 중심에는 문제를 정확하고 효율적으로 해결한다는 공통 목표가 있습니다.",
                fallbackDurationMs: 4200,
              },
              animation: {
                type: "highlight",
                targetNodeIds: [nodeIds.root],
                style: "pulse",
                durationMs: 2400,
              },
            },
          ],
        },
        {
          id: "showcase-branches",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "showcase-branches-number",
              narration: {
                text: "핵심 영역은 세 가지입니다. 데이터를 정리하는 자료구조, 해법을 설계하는 알고리즘, 실행 환경을 관리하는 운영체제입니다.",
                fallbackDurationMs: 6500,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: (
                  ["dataStructure", "algorithm", "operatingSystem"] as const
                ).map((key, index) => ({
                  type: "group",
                  mode: "parallel",
                  children: [
                    {
                      type: "highlight",
                      targetNodeIds: [nodeIds[key]],
                      style: "pop",
                      durationMs: BRANCH_BADGE_MS,
                    },
                    {
                      type: "badge",
                      targetNodeIds: [nodeIds[key]],
                      label: ["①", "②", "③"][index],
                      durationMs: BRANCH_BADGE_MS,
                      persist: true,
                    },
                  ],
                })),
              },
            },
          ],
        },
        {
          id: "showcase-data-structure",
          nodeId: nodeIds.dataStructure,
          beats: [
            {
              id: "showcase-data-structure-path",
              narration: {
                text: "자료구조 가운데 트리는 계층 관계를 표현하고, 힙은 그 구조를 활용해 우선순위를 빠르게 다룹니다.",
                fallbackDurationMs: 5400,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: [
                  {
                    type: "group",
                    mode: "parallel",
                    children: [
                      {
                        type: "focus",
                        targetNodeIds: pick(
                          "root",
                          "dataStructure",
                          "tree",
                          "binarySearchTree",
                          "heap",
                        ),
                        maxZoom: 1.1,
                        durationMs: 700,
                      },
                      {
                        type: "dim",
                        exceptNodeIds: deepPath,
                        durationMs: 700,
                        persist: true,
                      },
                    ],
                  },
                  {
                    type: "trace",
                    nodeIds: deepPath,
                    mode: "progressive",
                    style: "comet",
                    durationMs: 2400,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "showcase-data-structure-tree",
              narration: {
                text: "트리의 핵심은 각 데이터가 부모와 자식의 관계로 연결된다는 점입니다.",
                fallbackDurationMs: 4200,
              },
              animation: {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [nodeIds.tree],
                    style: "pulse",
                    durationMs: 3000,
                  },
                  {
                    type: "badge",
                    targetNodeIds: [nodeIds.tree],
                    label: "핵심",
                    durationMs: 3000,
                    persist: true,
                  },
                ],
              },
            },
          ],
        },
        {
          id: "showcase-quiz",
          nodeId: nodeIds.algorithm,
          beats: [
            {
              id: "showcase-quiz-question",
              narration: {
                text: "이번에는 알고리즘입니다. 여러 값을 기준에 맞춰 배치하려면 정렬과 탐색 중 무엇을 사용해야 할까요?",
                fallbackDurationMs: 5700,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: [
                  {
                    type: "group",
                    mode: "parallel",
                    children: [
                      {
                        type: "focus",
                        targetNodeIds: pick(
                          "algorithm",
                          "sort",
                          "search",
                          "quickSort",
                        ),
                        maxZoom: 1.1,
                        durationMs: 700,
                      },
                      {
                        type: "dim",
                        exceptNodeIds: pick(
                          "algorithm",
                          "sort",
                          "search",
                          "quickSort",
                        ),
                        durationMs: 700,
                        persist: true,
                      },
                    ],
                  },
                  {
                    type: "highlight",
                    targetNodeIds: pick("sort", "search"),
                    style: "steady",
                    durationMs: 2400,
                  },
                ],
              },
            },
            {
              id: "showcase-quiz-wrong",
              narration: {
                text: "탐색은 필요한 값을 찾는 방법입니다. 값을 순서대로 배치하는 답은 아닙니다.",
                fallbackDurationMs: 4400,
              },
              animation: {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [nodeIds.search],
                    style: "shake",
                    tone: "danger",
                    durationMs: 1600,
                  },
                  {
                    type: "badge",
                    targetNodeIds: [nodeIds.search],
                    label: "오답",
                    tone: "danger",
                    durationMs: 1600,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "showcase-quiz-right",
              narration: {
                text: "정답은 정렬입니다. 퀵 정렬은 기준값을 중심으로 데이터를 나누며 정렬을 반복합니다.",
                fallbackDurationMs: 5200,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: [
                  {
                    type: "group",
                    mode: "parallel",
                    children: [
                      {
                        type: "highlight",
                        targetNodeIds: [nodeIds.sort],
                        style: "sparkle",
                        tone: "success",
                        durationMs: 1200,
                        persist: true,
                      },
                      {
                        type: "badge",
                        targetNodeIds: [nodeIds.sort],
                        label: "정답",
                        tone: "success",
                        durationMs: 1200,
                        persist: true,
                      },
                    ],
                  },
                  /*
                  유지하는 효과는 레이어를 남기고 바로 다음 동작으로 넘어가므로, 반짝임을 먼저 보여 주려고 기다린다.
                  */
                  { type: "wait", durationMs: 1200 },
                  {
                    type: "trace",
                    nodeIds: pick("sort", "quickSort"),
                    style: "comet",
                    durationMs: 1200,
                    persist: true,
                  },
                ],
              },
            },
          ],
        },
        {
          id: "showcase-outro",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "showcase-outro-review",
              narration: {
                text: "지금 본 힙은 트리라는 자료구조에 속하고, 자료구조는 컴퓨터 사이언스의 주요 영역으로 이어집니다.",
                fallbackDurationMs: 5400,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: [
                  {
                    type: "focus",
                    targetNodeIds: allNodeIds,
                    maxZoom: 1,
                    durationMs: 800,
                  },
                  {
                    type: "trace",
                    nodeIds: deepPath,
                    mode: "progressive",
                    direction: "reverse",
                    style: "comet",
                    durationMs: 2400,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "showcase-outro-end",
              narration: {
                text: "개념 사이의 관계를 함께 보면, 복잡한 내용도 더 빠르고 선명하게 이해할 수 있습니다.",
                fallbackDurationMs: 4800,
              },
              animation: {
                type: "highlight",
                targetNodeIds: [nodeIds.root],
                style: "sparkle",
                durationMs: 3000,
              },
            },
          ],
        },
      ],
    };
  },
);
