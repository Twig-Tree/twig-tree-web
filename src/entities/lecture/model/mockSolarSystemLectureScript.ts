import { createDemoLecture, type DemoTreeNode } from "./createDemoLecture";
import { type LectureNodeId, type LectureNodePath } from "./types";

const ROOT = "태양계";
const SUN = "태양";
const PLANET = "행성";
const SMALL_BODY = "소천체";
const TERRESTRIAL = "지구형 행성";
const JOVIAN = "목성형 행성";
const MERCURY = "수성";
const VENUS = "금성";
const EARTH = "지구";
const MARS = "화성";
const JUPITER = "목성";
const SATURN = "토성";
const URANUS = "천왕성";
const NEPTUNE = "해왕성";
const ASTEROID = "소행성";
const COMET = "혜성";

export const SOLAR_SYSTEM_DEMO_TREE: DemoTreeNode = {
  name: ROOT,
  children: [
    { name: SUN },
    {
      name: PLANET,
      children: [
        {
          name: TERRESTRIAL,
          children: [
            { name: MERCURY },
            { name: VENUS },
            { name: EARTH },
            { name: MARS },
          ],
        },
        {
          name: JOVIAN,
          children: [
            { name: JUPITER },
            { name: SATURN },
            { name: URANUS },
            { name: NEPTUNE },
          ],
        },
      ],
    },
    {
      name: SMALL_BODY,
      children: [{ name: ASTEROID }, { name: COMET }],
    },
  ],
};

const NODE_PATHS = {
  root: [ROOT],
  sun: [ROOT, SUN],
  planet: [ROOT, PLANET],
  smallBody: [ROOT, SMALL_BODY],
  terrestrial: [ROOT, PLANET, TERRESTRIAL],
  jovian: [ROOT, PLANET, JOVIAN],
  mercury: [ROOT, PLANET, TERRESTRIAL, MERCURY],
  venus: [ROOT, PLANET, TERRESTRIAL, VENUS],
  earth: [ROOT, PLANET, TERRESTRIAL, EARTH],
  mars: [ROOT, PLANET, TERRESTRIAL, MARS],
  jupiter: [ROOT, PLANET, JOVIAN, JUPITER],
  saturn: [ROOT, PLANET, JOVIAN, SATURN],
  uranus: [ROOT, PLANET, JOVIAN, URANUS],
  neptune: [ROOT, PLANET, JOVIAN, NEPTUNE],
  asteroid: [ROOT, SMALL_BODY, ASTEROID],
  comet: [ROOT, SMALL_BODY, COMET],
} satisfies Record<string, LectureNodePath>;

type SolarNodeKey = keyof typeof NODE_PATHS;

const BRANCH_BADGE_MS = 1000;

/*
태양계의 구성과 행성 분류, 수성 퀴즈를 따라가며 발표용 연출을 모두 보여 주는 데모 강의다.
*/
export const SOLAR_SYSTEM_DEMO_LECTURE = createDemoLecture(
  NODE_PATHS,
  (nodeIds) => {
    const pick = (...keys: SolarNodeKey[]): LectureNodeId[] =>
      keys.map((key) => nodeIds[key]);
    const allNodeIds = Object.values(nodeIds);
    const earthPath = pick("root", "planet", "terrestrial", "earth");
    const cometPath = pick("root", "smallBody", "comet");

    return {
      id: "demo-solar-system",
      title: "태양계의 천체와 행성",
      scenes: [
        {
          id: "solar-intro",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "solar-intro-grow",
              narration: {
                text: "태양계는 태양과 그 주위를 도는 행성, 그리고 수많은 작은 천체로 이루어져 있습니다.",
                fallbackDurationMs: 5200,
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
                    durationMs: 4800,
                  },
                ],
              },
            },
            {
              id: "solar-intro-gravity",
              narration: {
                text: "태양은 태양계 질량의 대부분을 차지하며 강한 중력으로 천체들의 운동을 이끕니다.",
                fallbackDurationMs: 5000,
              },
              animation: {
                type: "highlight",
                targetNodeIds: [nodeIds.sun],
                style: "pulse",
                tone: "warning",
                durationMs: 3200,
              },
            },
          ],
        },
        {
          id: "solar-groups",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "solar-groups-number",
              narration: {
                text: "태양계의 주요 구성은 중심의 태양, 여덟 개의 행성, 그리고 소행성과 혜성 같은 소천체입니다.",
                fallbackDurationMs: 5700,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: (["sun", "planet", "smallBody"] as const).map(
                  (key, index) => ({
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
                        label: String(index + 1),
                        durationMs: BRANCH_BADGE_MS,
                        persist: true,
                      },
                    ],
                  }),
                ),
              },
            },
          ],
        },
        {
          id: "solar-planets",
          nodeId: nodeIds.planet,
          beats: [
            {
              id: "solar-earth-path",
              narration: {
                text: "행성은 성질에 따라 지구형과 목성형으로 나뉩니다. 지구는 단단한 표면을 가진 지구형 행성입니다.",
                fallbackDurationMs: 6000,
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
                          "planet",
                          "terrestrial",
                          "jovian",
                          "earth",
                          "mars",
                          "jupiter",
                          "saturn",
                        ),
                        maxZoom: 1.1,
                        durationMs: 700,
                      },
                      {
                        type: "dim",
                        exceptNodeIds: earthPath,
                        durationMs: 700,
                        persist: true,
                      },
                    ],
                  },
                  {
                    type: "trace",
                    nodeIds: earthPath,
                    mode: "progressive",
                    style: "comet",
                    durationMs: 2600,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "solar-terrestrial-feature",
              narration: {
                text: "수성, 금성, 지구, 화성은 크기가 비교적 작고 암석으로 이루어진 공통점이 있습니다.",
                fallbackDurationMs: 5200,
              },
              animation: {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [nodeIds.terrestrial],
                    style: "pulse",
                    durationMs: 3300,
                  },
                  {
                    type: "badge",
                    targetNodeIds: [nodeIds.terrestrial],
                    label: "★",
                    durationMs: 3300,
                    persist: true,
                  },
                ],
              },
            },
          ],
        },
        {
          id: "solar-quiz",
          nodeId: nodeIds.terrestrial,
          beats: [
            {
              id: "solar-quiz-question",
              narration: {
                text: "그렇다면 수성과 금성 가운데 태양에 가장 가까운 행성은 무엇일까요?",
                fallbackDurationMs: 4500,
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
                          "planet",
                          "terrestrial",
                          "mercury",
                          "venus",
                          "earth",
                        ),
                        maxZoom: 1.1,
                        durationMs: 700,
                      },
                      {
                        type: "dim",
                        exceptNodeIds: pick(
                          "planet",
                          "terrestrial",
                          "mercury",
                          "venus",
                          "earth",
                        ),
                        durationMs: 700,
                        persist: true,
                      },
                    ],
                  },
                  {
                    type: "highlight",
                    targetNodeIds: pick("mercury", "venus"),
                    style: "steady",
                    durationMs: 2400,
                  },
                ],
              },
            },
            {
              id: "solar-quiz-wrong",
              narration: {
                text: "금성은 태양에서 두 번째로 가까운 행성이므로 정답이 아닙니다.",
                fallbackDurationMs: 4000,
              },
              animation: {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [nodeIds.venus],
                    style: "shake",
                    tone: "danger",
                    durationMs: 1700,
                  },
                  {
                    type: "badge",
                    targetNodeIds: [nodeIds.venus],
                    label: "X",
                    tone: "danger",
                    durationMs: 1700,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "solar-quiz-right",
              narration: {
                text: "정답은 수성입니다. 수성은 태양에 가장 가깝고 공전 주기도 가장 짧습니다.",
                fallbackDurationMs: 4900,
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
                        targetNodeIds: [nodeIds.mercury],
                        style: "sparkle",
                        tone: "success",
                        durationMs: 1300,
                        persist: true,
                      },
                      {
                        type: "badge",
                        targetNodeIds: [nodeIds.mercury],
                        label: "O",
                        tone: "success",
                        durationMs: 1300,
                        persist: true,
                      },
                    ],
                  },
                  { type: "wait", durationMs: 1200 },
                  {
                    type: "trace",
                    nodeIds: pick("terrestrial", "mercury"),
                    style: "comet",
                    durationMs: 1400,
                    persist: true,
                  },
                ],
              },
            },
          ],
        },
        {
          id: "solar-outro",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "solar-outro-comet",
              narration: {
                text: "혜성은 얼음과 먼지로 이루어진 소천체이며 태양에 가까워지면 긴 꼬리를 드러냅니다.",
                fallbackDurationMs: 5200,
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
                    nodeIds: cometPath,
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
              id: "solar-outro-end",
              narration: {
                text: "행성과 소천체는 서로 다른 특징을 지니지만 모두 태양의 중력 안에서 움직입니다.",
                fallbackDurationMs: 4600,
              },
              animation: {
                type: "highlight",
                targetNodeIds: [nodeIds.root],
                style: "sparkle",
                durationMs: 3200,
              },
            },
          ],
        },
      ],
    };
  },
);
