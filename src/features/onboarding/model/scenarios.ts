export interface OnboardingTourStep {
  target: string; // 가리킬 요소의 이름표. 화면이 이름표와 요소를 잇는다
  title: string; // 단계 제목
  message: string; // 단계 문구
}

interface OnboardingScenarioDefinition {
  id: string; // 상황 ID
  version: number; // 문구나 가리키는 대상을 바꿀 때 올린다
  title?: string; // 카드 한 장으로 안내할 때의 제목. steps가 있으면 두지 않는다
  message?: string; // 카드 한 장으로 안내할 때의 문구. steps가 있으면 두지 않는다
  steps?: readonly OnboardingTourStep[]; // 여러 요소를 차례로 가리키는 안내의 단계. 배열 순서가 단계 순서다
}

/*
안내를 띄울 상황 목록. 배열 순서가 노출 순서다. 여러 상황에 동시에 도달하면 앞의 것부터 하나씩 보인다.

version은 문구나 가리키는 대상을 바꿨을 때 올린다. 본 기록의 version과 다르면 이미 닫은 사용자에게도 다시 보인다.
title은 사용자를 동작으로 이끄는 한 줄, message는 그 방법이다. 처음 온 사용자에게 건네는 말이라 해요체로 쓰고, 띄어쓰기는 #172의 기준을 따른다.
*/
export const ONBOARDING_SCENARIOS = [
  {
    id: "dashboard-prompt", // 대시보드 첫 진입, 트리 생성 입력
    version: 2,
    title: "첫 트리를 만들어 볼까요?",
    message:
      "궁금한 주제를 적거나 자료를 첨부해 보세요. 둘 다 함께 넣어도 좋아요.",
  },
  {
    id: "canvas-root-node", // 트리가 있는 워크스페이스 첫 열기, 루트 노드
    version: 3,
    title: "노드를 눌러 보세요",
    message: "노드를 선택하면 메모를 남기거나 하위 내용을 추가할 수 있어요.",
  },
  {
    id: "canvas-node-actions", // 노드 첫 선택, 선택 툴바
    version: 4,
    /*
    target은 선택 툴바의 동작 ID와 같다. features/tree-editor를 import할 수 없어 문자열로 적고, 워크스페이스 페이지가 버튼 요소와 잇는다.
    막힌 동작도 기능을 소개하려고 그대로 가리킨다. 막힌 이유는 버튼 툴팁이 알려 준다.
    */
    steps: [
      {
        target: "openMemo",
        title: "메모 남기기",
        message: "노드에 설명이나 자료를 적어 둘 수 있어요.",
      },
      {
        target: "addChild",
        title: "하위 노드 추가",
        message: "이 노드 아래에 새 노드를 만들어 내용을 넓혀요.",
      },
      {
        target: "rename",
        title: "이름 바꾸기",
        message: "노드 제목을 그 자리에서 고칠 수 있어요.",
      },
      {
        target: "delete",
        title: "노드 삭제",
        message: "하위 노드까지 함께 지워져요. 실행 취소로 되돌릴 수 있어요.",
      },
    ],
  },
] as const satisfies readonly OnboardingScenarioDefinition[];

export type OnboardingScenarioId = (typeof ONBOARDING_SCENARIOS)[number]["id"];

export type OnboardingSeenRecord = Partial<
  Record<OnboardingScenarioId, number>
>; // 상황별로 마지막에 닫은 안내의 version

export const ONBOARDING_STORAGE_KEY = "twig-tree:onboarding-seen";
