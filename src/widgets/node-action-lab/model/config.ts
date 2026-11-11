/*
노드 동작 메뉴를 여는 방법. 다음 단계에서 일반 클릭과 선택된 노드 다시 클릭을 더한다.
*/
export type MenuTrigger = "contextMenu" | "off";

/*
실험실에서 켜고 끄는 진입 방식의 묶음. 프리셋은 이 객체의 값 묶음이다.
*/
export type NodeActionLabConfig = {
  menuTrigger: MenuTrigger; // 노드 동작 메뉴를 여는 방법
};

export const DEFAULT_NODE_ACTION_LAB_CONFIG: NodeActionLabConfig = {
  menuTrigger: "contextMenu",
};

export const MENU_TRIGGER_OPTIONS: { value: MenuTrigger; label: string }[] = [
  { value: "contextMenu", label: "우클릭" },
  { value: "off", label: "끄기" },
];
