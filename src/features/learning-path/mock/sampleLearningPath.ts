import type { LearningPath } from "../model/types";

/*
실제 학습 경로 생성 API가 생기기 전까지 UI 경험을 검증하기 위한 고정 데이터다.
핵심 경로는 다섯 단계이며, 에너지 저장은 보충 경로, 정책과 시장은 심화 경로다.
두 선택 경로를 건너뛰어도 핵심 경로를 끝까지 진행할 수 있다.
*/
export const sampleLearningPath: LearningPath = {
  id: "renewable-energy-transition",
  version: 1,
  title: "재생 에너지 전환 이해하기",
  checkpoints: [
    {
      id: "transition-overview",
      title: "에너지 전환의 큰 그림",
      summary:
        "화석 연료 중심의 에너지 시스템이 재생 에너지 중심으로 바뀌는 이유와 전체 흐름을 살펴봅니다.",
      rationale:
        "세부 기술을 배우기 전에 전환의 목적과 주요 구성 요소를 알면 이후 개념의 위치를 쉽게 파악할 수 있습니다.",
      kind: "core",
      prerequisiteIds: [],
      sourceNodeIds: ["1", "2"],
      recommendedNextId: "renewable-fundamentals",
    },
    {
      id: "renewable-fundamentals",
      title: "재생 에너지의 기본 원리",
      summary:
        "태양광과 풍력이 에너지를 전기로 바꾸는 방식과 출력이 달라지는 조건을 비교합니다.",
      rationale:
        "발전원의 특성을 알아야 전력망에서 생기는 변동성과 공급 문제를 이해할 수 있습니다.",
      kind: "core",
      prerequisiteIds: ["transition-overview"],
      sourceNodeIds: ["3", "4"],
      recommendedNextId: "variable-generation",
    },
    {
      id: "variable-generation",
      title: "변동성 발전 이해하기",
      summary:
        "날씨와 시간에 따라 발전량이 달라지는 재생 에너지의 변동성과 수요·공급 균형 문제를 학습합니다.",
      rationale:
        "변동성은 저장 장치와 유연한 전력망이 필요한 직접적인 이유입니다.",
      kind: "core",
      prerequisiteIds: ["renewable-fundamentals"],
      sourceNodeIds: ["5", "6"],
      recommendedNextId: "grid-flexibility",
    },
    {
      id: "energy-storage",
      title: "에너지 저장 기술 보충",
      summary:
        "배터리, 양수 발전, 수소 저장이 남는 전력을 저장하고 필요할 때 공급하는 방식을 비교합니다.",
      rationale:
        "저장 기술을 더 자세히 알면 변동성 대응 수단의 장단점을 구체적으로 이해할 수 있습니다.",
      kind: "supplemental",
      prerequisiteIds: ["variable-generation"],
      sourceNodeIds: ["7", "8"],
      recommendedNextId: "grid-flexibility",
    },
    {
      id: "grid-flexibility",
      title: "유연한 전력망 설계",
      summary:
        "저장 장치, 수요 반응, 지역 간 전력 교환을 조합해 안정적인 전력망을 만드는 방법을 학습합니다.",
      rationale:
        "발전 기술이 실제 시스템에서 작동하려면 변동성을 흡수하는 운영 전략이 필요합니다.",
      kind: "core",
      prerequisiteIds: ["variable-generation"],
      sourceNodeIds: ["9", "10", "11"],
      recommendedNextId: "transition-strategy",
    },
    {
      id: "policy-and-market",
      title: "정책과 전력 시장 심화",
      summary:
        "탄소 가격, 보조금, 전력 시장 규칙이 재생 에너지 투자와 전력망 운영에 미치는 영향을 살펴봅니다.",
      rationale:
        "기술적으로 가능한 전환이 실제로 일어나려면 제도와 경제적 유인이 어떻게 맞물리는지 이해해야 합니다.",
      kind: "advanced",
      prerequisiteIds: ["grid-flexibility"],
      sourceNodeIds: ["12", "13"],
      recommendedNextId: "transition-strategy",
    },
    {
      id: "transition-strategy",
      title: "전환 전략 종합하기",
      summary:
        "발전원, 저장 기술, 전력망 운영을 연결해 현실적인 재생 에너지 전환 전략을 구성합니다.",
      rationale:
        "앞서 배운 개념을 하나의 시스템 관점으로 묶어야 실제 사례를 평가하고 대안을 비교할 수 있습니다.",
      kind: "core",
      prerequisiteIds: ["grid-flexibility"],
      sourceNodeIds: ["14", "15"],
      recommendedNextId: null,
    },
  ],
};
