import { type LectureNodeId, type LectureScript } from "./types";

export const WORLD_GEOGRAPHY_NODE_IDS = {
  world: "201",
  europe: "202",
  asia: "203",
  france: "204",
  germany: "205",
  euro: "206",
  paris: "207",
  berlin: "208",
  korea: "209",
  japan: "210",
  seoul: "211",
  won: "212",
  tokyo: "213",
  yen: "214",
} satisfies Record<string, LectureNodeId>;

export const WORLD_GEOGRAPHY_WORKSPACE_ID = "3";

/*
워크스페이스 3의 세계 지리 학습 트리를 위한 동적 강의 목데이터다.
대륙에서 국가, 국가에서 수도·통화로 내려가는 계층을 따라가며 관계 자체를 기억하게 한다.
각 비트의 애니메이션은 내레이션과 동시에 시작하고 fallbackDurationMs 안에 끝나도록 구성했다.
*/
export const WORLD_GEOGRAPHY_LECTURE_SCRIPT = {
  id: "world-geography-capitals-and-currencies",
  title: "세계 지리: 대륙에서 수도와 통화까지",
  scenes: [
    {
      id: "world-overview",
      nodeId: WORLD_GEOGRAPHY_NODE_IDS.world,
      beats: [
        {
          id: "world-overview-intro",
          narration: {
            text: "오늘은 세계를 유럽과 아시아로 나누고, 각 나라의 수도와 통화까지 연결해서 살펴보겠습니다.",
            fallbackDurationMs: 5200,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.world,
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.asia,
                ],
                maxZoom: 1,
                durationMs: 700,
              },
              {
                type: "highlight",
                targetNodeIds: [WORLD_GEOGRAPHY_NODE_IDS.world],
                style: "pulse",
                durationMs: 1200,
              },
            ],
          },
        },
        {
          id: "world-overview-continents",
          narration: {
            text: "세계라는 뿌리에서 유럽과 아시아라는 두 대륙이 갈라집니다. 먼저 이 두 갈래를 기억해 두세요.",
            fallbackDurationMs: 5000,
          },
          animation: {
            type: "group",
            mode: "parallel",
            children: [
              {
                type: "dim",
                exceptNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.world,
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.asia,
                ],
                durationMs: 2600,
              },
              {
                type: "trace",
                nodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.world,
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                ],
                durationMs: 2200,
              },
              {
                type: "trace",
                nodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.world,
                  WORLD_GEOGRAPHY_NODE_IDS.asia,
                ],
                durationMs: 2200,
              },
            ],
          },
        },
      ],
    },
    {
      id: "europe-countries",
      nodeId: WORLD_GEOGRAPHY_NODE_IDS.europe,
      beats: [
        {
          id: "europe-countries-intro",
          narration: {
            text: "유럽에는 프랑스와 독일이 있습니다. 두 나라는 서로 다른 수도를 갖지만 같은 유로를 사용합니다.",
            fallbackDurationMs: 5200,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.france,
                  WORLD_GEOGRAPHY_NODE_IDS.germany,
                  WORLD_GEOGRAPHY_NODE_IDS.euro,
                ],
                maxZoom: 1.1,
                durationMs: 700,
              },
              {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.france,
                      WORLD_GEOGRAPHY_NODE_IDS.germany,
                    ],
                    style: "steady",
                    durationMs: 1800,
                  },
                  {
                    type: "highlight",
                    targetNodeIds: [WORLD_GEOGRAPHY_NODE_IDS.euro],
                    style: "pulse",
                    durationMs: 1800,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "europe-countries-france",
          narration: {
            text: "유럽에서 프랑스로 내려가면 수도 파리를 만납니다. 프랑스와 파리를 한 쌍으로 기억하세요.",
            fallbackDurationMs: 4800,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.france,
                  WORLD_GEOGRAPHY_NODE_IDS.paris,
                ],
                maxZoom: 1.25,
                durationMs: 600,
              },
              {
                type: "trace",
                nodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.france,
                  WORLD_GEOGRAPHY_NODE_IDS.paris,
                ],
                durationMs: 1400,
              },
              {
                type: "highlight",
                targetNodeIds: [WORLD_GEOGRAPHY_NODE_IDS.paris],
                style: "pulse",
                durationMs: 1200,
              },
            ],
          },
        },
        {
          id: "europe-countries-germany",
          narration: {
            text: "독일의 수도는 베를린입니다. 유럽, 독일, 베를린의 순서로 경로를 이어 봅니다.",
            fallbackDurationMs: 4500,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.germany,
                  WORLD_GEOGRAPHY_NODE_IDS.berlin,
                ],
                maxZoom: 1.25,
                durationMs: 600,
              },
              {
                type: "trace",
                nodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.germany,
                  WORLD_GEOGRAPHY_NODE_IDS.berlin,
                ],
                durationMs: 1400,
              },
              {
                type: "highlight",
                targetNodeIds: [WORLD_GEOGRAPHY_NODE_IDS.berlin],
                style: "pulse",
                durationMs: 1200,
              },
            ],
          },
        },
        {
          id: "europe-countries-currency",
          narration: {
            text: "프랑스와 독일은 수도는 다르지만 통화는 모두 유로입니다. 차이점과 공통점을 함께 묶어 기억하세요.",
            fallbackDurationMs: 5000,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "trace",
                nodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.euro,
                ],
                durationMs: 1000,
              },
              {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetNodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.france,
                      WORLD_GEOGRAPHY_NODE_IDS.germany,
                    ],
                    style: "steady",
                    durationMs: 1800,
                  },
                  {
                    type: "highlight",
                    targetNodeIds: [WORLD_GEOGRAPHY_NODE_IDS.euro],
                    style: "pulse",
                    durationMs: 1800,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    {
      id: "asia-countries",
      nodeId: WORLD_GEOGRAPHY_NODE_IDS.asia,
      beats: [
        {
          id: "asia-countries-intro",
          narration: {
            text: "이제 아시아로 이동합니다. 여기서는 대한민국과 일본이 각각 다른 수도와 통화를 가집니다.",
            fallbackDurationMs: 4800,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.asia,
                  WORLD_GEOGRAPHY_NODE_IDS.korea,
                  WORLD_GEOGRAPHY_NODE_IDS.japan,
                ],
                maxZoom: 1.1,
                durationMs: 700,
              },
              {
                type: "highlight",
                targetNodeIds: [WORLD_GEOGRAPHY_NODE_IDS.asia],
                style: "pulse",
                durationMs: 1200,
              },
            ],
          },
        },
        {
          id: "asia-countries-korea",
          narration: {
            text: "대한민국의 수도는 서울이고 통화는 원입니다. 대한민국에서 서울과 원으로 갈라지는 두 관계를 확인합니다.",
            fallbackDurationMs: 5200,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.korea,
                  WORLD_GEOGRAPHY_NODE_IDS.seoul,
                  WORLD_GEOGRAPHY_NODE_IDS.won,
                ],
                maxZoom: 1.2,
                durationMs: 600,
              },
              {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "trace",
                    nodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.asia,
                      WORLD_GEOGRAPHY_NODE_IDS.korea,
                      WORLD_GEOGRAPHY_NODE_IDS.seoul,
                    ],
                    durationMs: 1800,
                  },
                  {
                    type: "trace",
                    nodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.korea,
                      WORLD_GEOGRAPHY_NODE_IDS.won,
                    ],
                    durationMs: 1800,
                  },
                  {
                    type: "highlight",
                    targetNodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.seoul,
                      WORLD_GEOGRAPHY_NODE_IDS.won,
                    ],
                    style: "pulse",
                    durationMs: 1800,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "asia-countries-japan",
          narration: {
            text: "일본의 수도는 도쿄이고 통화는 엔입니다. 일본, 도쿄, 엔을 하나의 묶음으로 기억하세요.",
            fallbackDurationMs: 4800,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.japan,
                  WORLD_GEOGRAPHY_NODE_IDS.tokyo,
                  WORLD_GEOGRAPHY_NODE_IDS.yen,
                ],
                maxZoom: 1.2,
                durationMs: 600,
              },
              {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "trace",
                    nodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.asia,
                      WORLD_GEOGRAPHY_NODE_IDS.japan,
                      WORLD_GEOGRAPHY_NODE_IDS.tokyo,
                    ],
                    durationMs: 1800,
                  },
                  {
                    type: "trace",
                    nodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.japan,
                      WORLD_GEOGRAPHY_NODE_IDS.yen,
                    ],
                    durationMs: 1800,
                  },
                  {
                    type: "highlight",
                    targetNodeIds: [
                      WORLD_GEOGRAPHY_NODE_IDS.tokyo,
                      WORLD_GEOGRAPHY_NODE_IDS.yen,
                    ],
                    style: "pulse",
                    durationMs: 1800,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    {
      id: "world-recap",
      nodeId: WORLD_GEOGRAPHY_NODE_IDS.world,
      beats: [
        {
          id: "world-recap-capitals",
          narration: {
            text: "수도를 복습합니다. 프랑스는 파리, 독일은 베를린, 대한민국은 서울, 일본은 도쿄입니다.",
            fallbackDurationMs: 5600,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.paris,
                  WORLD_GEOGRAPHY_NODE_IDS.berlin,
                  WORLD_GEOGRAPHY_NODE_IDS.seoul,
                  WORLD_GEOGRAPHY_NODE_IDS.tokyo,
                ],
                maxZoom: 0.95,
                durationMs: 800,
              },
              {
                type: "highlight",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.paris,
                  WORLD_GEOGRAPHY_NODE_IDS.berlin,
                  WORLD_GEOGRAPHY_NODE_IDS.seoul,
                  WORLD_GEOGRAPHY_NODE_IDS.tokyo,
                ],
                style: "pulse",
                durationMs: 2200,
              },
            ],
          },
        },
        {
          id: "world-recap-currencies",
          narration: {
            text: "통화를 복습합니다. 프랑스와 독일은 유로, 대한민국은 원, 일본은 엔을 사용합니다.",
            fallbackDurationMs: 5200,
          },
          animation: {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "focus",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.euro,
                  WORLD_GEOGRAPHY_NODE_IDS.won,
                  WORLD_GEOGRAPHY_NODE_IDS.yen,
                ],
                maxZoom: 1,
                durationMs: 800,
              },
              {
                type: "highlight",
                targetNodeIds: [
                  WORLD_GEOGRAPHY_NODE_IDS.euro,
                  WORLD_GEOGRAPHY_NODE_IDS.won,
                  WORLD_GEOGRAPHY_NODE_IDS.yen,
                ],
                style: "pulse",
                durationMs: 2200,
              },
            ],
          },
        },
        {
          id: "world-recap-end",
          narration: {
            text: "대륙에서 국가로, 국가에서 수도와 통화로 이어지는 경로를 떠올리며 오늘 내용을 마무리하겠습니다.",
            fallbackDurationMs: 5000,
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
                  WORLD_GEOGRAPHY_NODE_IDS.world,
                  WORLD_GEOGRAPHY_NODE_IDS.europe,
                  WORLD_GEOGRAPHY_NODE_IDS.asia,
                ],
                maxZoom: 1,
                durationMs: 800,
              },
              {
                type: "highlight",
                targetNodeIds: [WORLD_GEOGRAPHY_NODE_IDS.world],
                style: "steady",
                durationMs: 1600,
              },
            ],
          },
        },
      ],
    },
  ],
} satisfies LectureScript;
