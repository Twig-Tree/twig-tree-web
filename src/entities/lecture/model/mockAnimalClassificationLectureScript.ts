import { createDemoLecture, type DemoTreeNode } from "./createDemoLecture";
import { type LectureNodeId, type LectureNodePath } from "./types";

const ROOT = "동물의 분류";
const VERTEBRATE = "척추동물";
const INVERTEBRATE = "무척추동물";
const MAMMAL = "포유류";
const FISH = "어류";
const BIRD = "조류";
const WHALE = "고래";
const BAT = "박쥐";
const SHARK = "상어";
const ARTHROPOD = "절지동물";
const MOLLUSK = "연체동물";
const INSECT = "곤충";
const OCTOPUS = "문어";

export const ANIMAL_CLASSIFICATION_DEMO_TREE: DemoTreeNode = {
  name: ROOT,
  children: [
    {
      name: VERTEBRATE,
      children: [
        {
          name: MAMMAL,
          children: [{ name: WHALE }, { name: BAT }],
        },
        { name: FISH, children: [{ name: SHARK }] },
        { name: BIRD },
      ],
    },
    {
      name: INVERTEBRATE,
      children: [
        { name: ARTHROPOD, children: [{ name: INSECT }] },
        { name: MOLLUSK, children: [{ name: OCTOPUS }] },
      ],
    },
  ],
};

const NODE_PATHS = {
  root: [ROOT],
  vertebrate: [ROOT, VERTEBRATE],
  invertebrate: [ROOT, INVERTEBRATE],
  mammal: [ROOT, VERTEBRATE, MAMMAL],
  fish: [ROOT, VERTEBRATE, FISH],
  bird: [ROOT, VERTEBRATE, BIRD],
  whale: [ROOT, VERTEBRATE, MAMMAL, WHALE],
  bat: [ROOT, VERTEBRATE, MAMMAL, BAT],
  shark: [ROOT, VERTEBRATE, FISH, SHARK],
  arthropod: [ROOT, INVERTEBRATE, ARTHROPOD],
  mollusk: [ROOT, INVERTEBRATE, MOLLUSK],
  insect: [ROOT, INVERTEBRATE, ARTHROPOD, INSECT],
  octopus: [ROOT, INVERTEBRATE, MOLLUSK, OCTOPUS],
} satisfies Record<string, LectureNodePath>;

type AnimalNodeKey = keyof typeof NODE_PATHS;

const BRANCH_BADGE_MS = 1100;

/*
동물 분류의 포함 관계와 고래 분류 퀴즈를 따라가며 발표용 연출을 모두 보여 주는 데모 강의다.
*/
export const ANIMAL_CLASSIFICATION_DEMO_LECTURE = createDemoLecture(
  NODE_PATHS,
  (nodeIds) => {
    const pick = (...keys: AnimalNodeKey[]): LectureNodeId[] =>
      keys.map((key) => nodeIds[key]);
    const allNodeIds = Object.values(nodeIds);
    const whalePath = pick("root", "vertebrate", "mammal", "whale");

    return {
      id: "demo-animal-classification",
      title: "특징으로 이해하는 동물의 분류",
      scenes: [
        {
          id: "animal-intro",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "animal-intro-grow",
              narration: {
                text: "동물은 몸의 구조와 생활 방식에 따라 여러 집단으로 분류됩니다. 전체 구성을 먼저 살펴보겠습니다.",
                fallbackDurationMs: 5400,
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
              id: "animal-intro-principle",
              narration: {
                text: "분류할 때는 사는 장소보다 몸의 공통된 특징과 번식 방식을 중요하게 봅니다.",
                fallbackDurationMs: 4500,
              },
              animation: {
                type: "highlight",
                targetNodeIds: [nodeIds.root],
                style: "pulse",
                durationMs: 2800,
              },
            },
          ],
        },
        {
          id: "animal-groups",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "animal-groups-number",
              narration: {
                text: "먼저 척추가 있는 척추동물과 척추가 없는 무척추동물로 크게 나눌 수 있습니다.",
                fallbackDurationMs: 5000,
              },
              animation: {
                type: "group",
                mode: "sequence",
                children: (["vertebrate", "invertebrate"] as const).map(
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
          id: "animal-mammal",
          nodeId: nodeIds.mammal,
          beats: [
            {
              id: "animal-mammal-path",
              narration: {
                text: "척추동물 가운데 포유류는 허파로 숨 쉬고 새끼에게 젖을 먹입니다. 고래도 이 특징을 갖습니다.",
                fallbackDurationMs: 5800,
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
                          "vertebrate",
                          "mammal",
                          "fish",
                          "whale",
                          "bat",
                          "shark",
                        ),
                        maxZoom: 1.1,
                        durationMs: 700,
                      },
                      {
                        type: "dim",
                        exceptNodeIds: whalePath,
                        durationMs: 700,
                        persist: true,
                      },
                    ],
                  },
                  {
                    type: "trace",
                    nodeIds: whalePath,
                    mode: "progressive",
                    style: "comet",
                    durationMs: 2600,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "animal-mammal-feature",
              narration: {
                text: "포유류의 핵심은 겉모습이 아니라 호흡과 체온, 새끼를 기르는 방식에 있습니다.",
                fallbackDurationMs: 4700,
              },
              animation: {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [nodeIds.mammal],
                    style: "pulse",
                    durationMs: 3200,
                  },
                  {
                    type: "badge",
                    targetNodeIds: [nodeIds.mammal],
                    label: "★",
                    durationMs: 3200,
                    persist: true,
                  },
                ],
              },
            },
          ],
        },
        {
          id: "animal-quiz",
          nodeId: nodeIds.vertebrate,
          beats: [
            {
              id: "animal-quiz-question",
              narration: {
                text: "그렇다면 물속에 사는 고래는 어류와 포유류 중 어디에 속할까요?",
                fallbackDurationMs: 4400,
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
                          "vertebrate",
                          "mammal",
                          "fish",
                          "whale",
                          "shark",
                        ),
                        maxZoom: 1.1,
                        durationMs: 700,
                      },
                      {
                        type: "dim",
                        exceptNodeIds: pick(
                          "vertebrate",
                          "mammal",
                          "fish",
                          "whale",
                          "shark",
                        ),
                        durationMs: 700,
                        persist: true,
                      },
                    ],
                  },
                  {
                    type: "highlight",
                    targetNodeIds: pick("mammal", "fish"),
                    style: "steady",
                    durationMs: 2400,
                  },
                ],
              },
            },
            {
              id: "animal-quiz-wrong",
              narration: {
                text: "어류는 아가미로 숨 쉬지만 고래는 허파로 숨 쉬므로 어류가 아닙니다.",
                fallbackDurationMs: 4500,
              },
              animation: {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [nodeIds.fish],
                    style: "shake",
                    tone: "danger",
                    durationMs: 1700,
                  },
                  {
                    type: "badge",
                    targetNodeIds: [nodeIds.fish],
                    label: "X",
                    tone: "danger",
                    durationMs: 1700,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "animal-quiz-right",
              narration: {
                text: "정답은 포유류입니다. 고래는 새끼를 낳고 젖을 먹이며 일정한 체온을 유지합니다.",
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
                        targetNodeIds: [nodeIds.mammal],
                        style: "sparkle",
                        tone: "success",
                        durationMs: 1300,
                        persist: true,
                      },
                      {
                        type: "badge",
                        targetNodeIds: [nodeIds.mammal],
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
                    nodeIds: pick("mammal", "whale"),
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
          id: "animal-outro",
          nodeId: nodeIds.root,
          beats: [
            {
              id: "animal-outro-review",
              narration: {
                text: "고래에서 출발해 포유류와 척추동물을 거치면 동물 분류 안에서의 위치가 분명해집니다.",
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
                    nodeIds: whalePath,
                    mode: "progressive",
                    direction: "reverse",
                    style: "comet",
                    durationMs: 2600,
                    persist: true,
                  },
                ],
              },
            },
            {
              id: "animal-outro-end",
              narration: {
                text: "동물은 서식지가 아니라 몸의 구조와 생명 활동의 공통점을 기준으로 분류합니다.",
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
