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
발표 시연용 강의. 강의 연출을 모두 한 번씩 보여 주도록 짰다.
- 시작: 루트에서 트리가 자라고(grow), 내레이션이 한 글자씩 자막으로 나온다
- 갈래 소개: 큰 갈래마다 튀어 오르며(pop) 번호 꼬리표(badge)가 붙는다
- 자료구조: 나머지를 흐리고(dim) 혜성(trace comet)이 깊은 경로를 따라 내려간 뒤 핵심 노드를 숨쉬게(pulse) 한다
- 퀴즈: 오답은 흔들고(shake) 정답은 반짝인다(sparkle)
- 마무리: 혜성이 리프에서 루트로 거슬러 오르고 루트가 반짝인다

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
                text: "오늘은 컴퓨터 사이언스라는 큰 나무가 어떻게 뻗어 나가는지 함께 보겠습니다.",
                fallbackDurationMs: 4600,
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
                text: "뿌리에서 시작한 지식은 가지를 따라 점점 구체적인 개념으로 나뉩니다.",
                fallbackDurationMs: 4400,
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
                text: "큰 가지는 세 개입니다. 자료구조, 알고리즘, 그리고 운영체제입니다.",
                fallbackDurationMs: 4600,
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
                text: "먼저 자료구조 가지를 따라 깊이 내려가 보겠습니다.",
                fallbackDurationMs: 3600,
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
                text: "트리는 데이터를 부모와 자식의 계층으로 담는 구조입니다.",
                fallbackDurationMs: 4000,
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
                text: "그렇다면 값을 정해진 순서로 늘어놓는 일은 어느 쪽일까요?",
                fallbackDurationMs: 3800,
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
                text: "탐색은 원하는 값을 찾아내는 일이라 정답이 아닙니다.",
                fallbackDurationMs: 3600,
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
                text: "정답은 정렬입니다. 퀵 정렬이 대표적인 방법입니다.",
                fallbackDurationMs: 3800,
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
                text: "마지막으로 힙에서 뿌리까지 거슬러 올라가며 정리해 보겠습니다.",
                fallbackDurationMs: 4200,
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
                text: "가지를 따라가면 복잡한 지식도 한눈에 보입니다. 감사합니다.",
                fallbackDurationMs: 4000,
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
