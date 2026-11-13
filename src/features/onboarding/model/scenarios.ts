/*
안내를 띄울 상황 목록. 배열 순서가 노출 순서다. 여러 상황에 동시에 도달하면 앞의 것부터 하나씩 보인다.

version은 문구나 가리키는 대상을 바꿨을 때 올린다. 본 기록의 version과 다르면 이미 닫은 사용자에게도 다시 보인다.
문구는 #172의 기준(합니다체, 띄어쓰기)을 따른다.
*/
export const ONBOARDING_SCENARIOS = [
  {
    id: "dashboard-prompt", // 대시보드 첫 진입, 트리 생성 입력
    version: 1,
    message:
      "주제만 적어도, 파일만 첨부해도 트리를 만들 수 있습니다. 둘 다 넣어도 됩니다.",
  },
  {
    id: "canvas-root-node", // 트리가 있는 워크스페이스 첫 열기, 루트 노드
    version: 1,
    message: "노드를 선택하면 할 수 있는 동작이 노드 아래에 나타납니다.",
  },
  {
    id: "canvas-node-actions", // 노드 첫 선택, 선택 툴바
    version: 1,
    message:
      "메모 버튼으로 노드에 설명을 남기고, 추가 버튼으로 하위 노드를 만듭니다.",
  },
] as const;

export type OnboardingScenarioId = (typeof ONBOARDING_SCENARIOS)[number]["id"];

export type OnboardingSeenRecord = Partial<
  Record<OnboardingScenarioId, number>
>; // 상황별로 마지막에 닫은 안내의 version

export const ONBOARDING_STORAGE_KEY = "twig-tree:onboarding-seen";
