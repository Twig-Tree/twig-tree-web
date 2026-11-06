import { createDemoLecture, type DemoTreeNode } from "./createDemoLecture";
import { type LectureNodePath } from "./types";

const ROOT = "고구려";
const FOUNDING = "건국과 성장";
const PRIME = "전성기";
const RESISTANCE = "대외 항쟁";
const FALL = "멸망";
const JUMONG = "주몽";
const YURI = "유리왕";
const TAEJO = "태조왕";
const GWANGGAETO = "광개토대왕";
const JANGSU = "장수왕";
const SALSU = "살수대첩";
const ANSI = "안시성 전투";
const YEON = "연개소문";
const ALLIANCE = "나당 연합군";

/*
DB에 만들 트리의 원본. 대본의 이름 경로와 같은 이름 상수를 쓰므로 둘이 어긋나지 않는다.
*/
export const GOGURYEO_DEMO_TREE: DemoTreeNode = {
  name: ROOT,
  children: [
    {
      name: FOUNDING,
      children: [{ name: JUMONG }, { name: YURI }, { name: TAEJO }],
    },
    {
      name: PRIME,
      children: [{ name: GWANGGAETO }, { name: JANGSU }],
    },
    {
      name: RESISTANCE,
      children: [{ name: SALSU }, { name: ANSI }],
    },
    {
      name: FALL,
      children: [{ name: YEON }, { name: ALLIANCE }],
    },
  ],
};

const NODE_PATHS = {
  root: [ROOT],
  founding: [ROOT, FOUNDING],
  prime: [ROOT, PRIME],
  resistance: [ROOT, RESISTANCE],
  fall: [ROOT, FALL],
  jumong: [ROOT, FOUNDING, JUMONG],
  yuri: [ROOT, FOUNDING, YURI],
  taejo: [ROOT, FOUNDING, TAEJO],
  gwanggaeto: [ROOT, PRIME, GWANGGAETO],
  jangsu: [ROOT, PRIME, JANGSU],
  salsu: [ROOT, RESISTANCE, SALSU],
  ansi: [ROOT, RESISTANCE, ANSI],
  yeon: [ROOT, FALL, YEON],
  alliance: [ROOT, FALL, ALLIANCE],
} satisfies Record<string, LectureNodePath>;

/*
한국사 고구려 파트의 강의 데모다. 네 갈래를 시대순으로 내려가며 인물과 사건을 흐름으로 연결한다.
건국 연도는 삼국사기의 기록을 따른다.
각 비트의 애니메이션은 내레이션과 동시에 시작하고 fallbackDurationMs 안에 끝나도록 구성했다.
*/
export const GOGURYEO_DEMO_LECTURE = createDemoLecture(
  NODE_PATHS,
  (nodeIds) => ({
    id: "korean-history-goguryeo",
    title: "한국사: 고구려의 건국에서 멸망까지",
    scenes: [
      {
        id: "goguryeo-overview",
        nodeId: nodeIds.root,
        beats: [
          {
            id: "goguryeo-overview-intro",
            narration: {
              text: "오늘은 고구려의 역사를 건국과 성장, 전성기, 대외 항쟁, 멸망의 네 갈래로 나누어 살펴보겠습니다.",
              fallbackDurationMs: 5800,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [
                    nodeIds.root,
                    nodeIds.founding,
                    nodeIds.prime,
                    nodeIds.resistance,
                    nodeIds.fall,
                  ],
                  maxZoom: 1,
                  durationMs: 700,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.root],
                  style: "pulse",
                  durationMs: 1200,
                },
              ],
            },
          },
          {
            id: "goguryeo-overview-span",
            narration: {
              text: "삼국사기에 따르면 고구려는 기원전 37년에 세워져 668년까지 700년 넘게 이어졌습니다.",
              fallbackDurationMs: 5400,
            },
            animation: {
              type: "group",
              mode: "parallel",
              children: [
                {
                  type: "dim",
                  exceptNodeIds: [
                    nodeIds.root,
                    nodeIds.founding,
                    nodeIds.prime,
                    nodeIds.resistance,
                    nodeIds.fall,
                  ],
                  durationMs: 2800,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.founding],
                  durationMs: 2200,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.prime],
                  durationMs: 2200,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.resistance],
                  durationMs: 2200,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.fall],
                  durationMs: 2200,
                },
              ],
            },
          },
        ],
      },
      {
        id: "goguryeo-founding",
        nodeId: nodeIds.founding,
        beats: [
          {
            id: "goguryeo-founding-intro",
            narration: {
              text: "건국과 성장은 세 왕으로 정리할 수 있습니다. 주몽, 유리왕, 태조왕입니다.",
              fallbackDurationMs: 4600,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [
                    nodeIds.founding,
                    nodeIds.jumong,
                    nodeIds.yuri,
                    nodeIds.taejo,
                  ],
                  maxZoom: 1.1,
                  durationMs: 700,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.jumong, nodeIds.yuri, nodeIds.taejo],
                  style: "steady",
                  durationMs: 1800,
                },
              ],
            },
          },
          {
            id: "goguryeo-founding-jumong",
            narration: {
              text: "주몽은 부여에서 남쪽으로 내려와 졸본에 고구려를 세웠습니다.",
              fallbackDurationMs: 4000,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.founding, nodeIds.jumong],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.founding, nodeIds.jumong],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.jumong],
                  style: "pulse",
                  durationMs: 1200,
                },
              ],
            },
          },
          {
            id: "goguryeo-founding-yuri",
            narration: {
              text: "유리왕은 도읍을 졸본에서 압록강 가의 국내성으로 옮겼습니다.",
              fallbackDurationMs: 4000,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.founding, nodeIds.yuri],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.founding, nodeIds.yuri],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.yuri],
                  style: "pulse",
                  durationMs: 1200,
                },
              ],
            },
          },
          {
            id: "goguryeo-founding-taejo",
            narration: {
              text: "태조왕은 옥저를 복속시켜 동해안까지 세력을 넓혔고, 왕위를 고씨가 이어 가는 틀을 다졌습니다.",
              fallbackDurationMs: 5600,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.founding, nodeIds.taejo],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.founding, nodeIds.taejo],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.taejo],
                  style: "pulse",
                  durationMs: 1200,
                },
              ],
            },
          },
        ],
      },
      {
        id: "goguryeo-prime",
        nodeId: nodeIds.prime,
        beats: [
          {
            id: "goguryeo-prime-intro",
            narration: {
              text: "고구려의 전성기는 광개토대왕과 그 아들 장수왕의 시대입니다.",
              fallbackDurationMs: 4000,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [
                    nodeIds.prime,
                    nodeIds.gwanggaeto,
                    nodeIds.jangsu,
                  ],
                  maxZoom: 1.1,
                  durationMs: 700,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.gwanggaeto, nodeIds.jangsu],
                  style: "steady",
                  durationMs: 1800,
                },
              ],
            },
          },
          {
            id: "goguryeo-prime-gwanggaeto",
            narration: {
              text: "광개토대왕은 요동과 만주로 영토를 넓히고 백제를 압박했습니다. 400년에는 신라에 군대를 보내 왜를 물리쳤습니다.",
              fallbackDurationMs: 6600,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.prime, nodeIds.gwanggaeto],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.prime, nodeIds.gwanggaeto],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.gwanggaeto],
                  style: "pulse",
                  durationMs: 1400,
                },
              ],
            },
          },
          {
            id: "goguryeo-prime-jangsu",
            narration: {
              text: "장수왕은 427년 평양으로 도읍을 옮겨 남쪽으로 나아갔습니다. 475년에는 백제의 수도 한성을 함락하고 한강 유역을 차지했습니다.",
              fallbackDurationMs: 7400,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.prime, nodeIds.jangsu],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.prime, nodeIds.jangsu],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.jangsu],
                  style: "pulse",
                  durationMs: 1400,
                },
              ],
            },
          },
          {
            id: "goguryeo-prime-compare",
            narration: {
              text: "두 왕을 함께 기억하세요. 광개토대왕이 북방을 넓혔다면, 장수왕은 남쪽으로 눈을 돌렸습니다.",
              fallbackDurationMs: 5400,
            },
            animation: {
              type: "group",
              mode: "parallel",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [
                    nodeIds.prime,
                    nodeIds.gwanggaeto,
                    nodeIds.jangsu,
                  ],
                  maxZoom: 1.1,
                  durationMs: 700,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.gwanggaeto, nodeIds.jangsu],
                  style: "pulse",
                  durationMs: 2000,
                },
              ],
            },
          },
        ],
      },
      {
        id: "goguryeo-resistance",
        nodeId: nodeIds.resistance,
        beats: [
          {
            id: "goguryeo-resistance-intro",
            narration: {
              text: "이후 고구려는 중국을 통일한 수나라, 그 뒤를 이은 당나라와 차례로 맞섭니다.",
              fallbackDurationMs: 4800,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [
                    nodeIds.resistance,
                    nodeIds.salsu,
                    nodeIds.ansi,
                  ],
                  maxZoom: 1.1,
                  durationMs: 700,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.resistance],
                  style: "pulse",
                  durationMs: 1200,
                },
              ],
            },
          },
          {
            id: "goguryeo-resistance-salsu",
            narration: {
              text: "612년, 을지문덕은 수나라 별동대를 살수까지 끌어들여 크게 물리쳤습니다. 이것이 살수대첩입니다.",
              fallbackDurationMs: 5800,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.resistance, nodeIds.salsu],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.resistance, nodeIds.salsu],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.salsu],
                  style: "pulse",
                  durationMs: 1400,
                },
              ],
            },
          },
          {
            id: "goguryeo-resistance-ansi",
            narration: {
              text: "645년에는 당 태종의 대군이 안시성을 에워쌌지만, 고구려군은 두 달 넘게 버텨 물러나게 했습니다.",
              fallbackDurationMs: 5800,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.resistance, nodeIds.ansi],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.resistance, nodeIds.ansi],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.ansi],
                  style: "pulse",
                  durationMs: 1400,
                },
              ],
            },
          },
        ],
      },
      {
        id: "goguryeo-fall",
        nodeId: nodeIds.fall,
        beats: [
          {
            id: "goguryeo-fall-intro",
            narration: {
              text: "오랜 전쟁을 버틴 고구려는 안에서부터 흔들리기 시작합니다.",
              fallbackDurationMs: 3800,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.fall, nodeIds.yeon, nodeIds.alliance],
                  maxZoom: 1.1,
                  durationMs: 700,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.fall],
                  style: "pulse",
                  durationMs: 1200,
                },
              ],
            },
          },
          {
            id: "goguryeo-fall-yeon",
            narration: {
              text: "연개소문은 642년 정변으로 권력을 잡아 당나라에 강경하게 맞섰습니다. 그가 죽은 뒤에는 아들들이 권력을 두고 다퉜습니다.",
              fallbackDurationMs: 7000,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.fall, nodeIds.yeon],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.fall, nodeIds.yeon],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.yeon],
                  style: "pulse",
                  durationMs: 1400,
                },
              ],
            },
          },
          {
            id: "goguryeo-fall-alliance",
            narration: {
              text: "신라와 당나라는 손을 잡고 660년에 백제를 먼저 무너뜨렸습니다. 그리고 668년, 나당 연합군이 평양성을 함락하며 고구려는 멸망합니다.",
              fallbackDurationMs: 7800,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "focus",
                  targetNodeIds: [nodeIds.fall, nodeIds.alliance],
                  maxZoom: 1.25,
                  durationMs: 600,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.fall, nodeIds.alliance],
                  durationMs: 1000,
                },
                {
                  type: "highlight",
                  targetNodeIds: [nodeIds.alliance],
                  style: "pulse",
                  durationMs: 1400,
                },
              ],
            },
          },
        ],
      },
      {
        id: "goguryeo-review",
        nodeId: nodeIds.root,
        beats: [
          {
            id: "goguryeo-review-flow",
            narration: {
              text: "건국에서 멸망까지의 흐름을 다시 이어 보겠습니다.",
              fallbackDurationMs: 3200,
            },
            animation: {
              type: "group",
              mode: "sequence",
              children: [
                {
                  type: "reset",
                  scope: "visual",
                },
                {
                  type: "focus",
                  targetNodeIds: [
                    nodeIds.root,
                    nodeIds.jumong,
                    nodeIds.jangsu,
                    nodeIds.salsu,
                    nodeIds.alliance,
                  ],
                  maxZoom: 1,
                  durationMs: 800,
                },
              ],
            },
          },
          {
            id: "goguryeo-review-keywords",
            narration: {
              text: "주몽의 건국, 장수왕의 전성기, 살수대첩의 승리, 그리고 668년의 멸망. 이 네 장면을 기억해 두세요.",
              fallbackDurationMs: 6000,
            },
            animation: {
              type: "group",
              mode: "parallel",
              children: [
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.founding, nodeIds.jumong],
                  durationMs: 2200,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.prime, nodeIds.jangsu],
                  durationMs: 2200,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.resistance, nodeIds.salsu],
                  durationMs: 2200,
                },
                {
                  type: "trace",
                  nodeIds: [nodeIds.root, nodeIds.fall, nodeIds.alliance],
                  durationMs: 2200,
                },
                {
                  type: "highlight",
                  targetNodeIds: [
                    nodeIds.jumong,
                    nodeIds.jangsu,
                    nodeIds.salsu,
                    nodeIds.alliance,
                  ],
                  style: "steady",
                  durationMs: 3000,
                },
              ],
            },
          },
        ],
      },
    ],
  }),
);
