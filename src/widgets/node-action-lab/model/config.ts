/*
노드 동작 메뉴를 여는 방법. 한 번에 하나만 켜서 방식끼리 섞이지 않게 비교한다.
- contextMenu: 노드를 우클릭한다. 지금 제품과 같다
- click: 노드를 한 번 누른다
- clickSelected: 이미 선택된 노드를 다시 누른다. 첫 클릭은 선택만 한다
*/
export type MenuTrigger = "contextMenu" | "click" | "clickSelected" | "off";

export type MenuEntry = Exclude<MenuTrigger, "off">; // 메뉴가 열린 방법. 실행 기록의 진입점이 된다

/*
실험실에서 켜고 끄는 진입 방식의 묶음. 프리셋은 이 객체의 값 묶음이다.
*/
export type NodeActionLabConfig = {
  menuTrigger: MenuTrigger; // 노드 동작 메뉴를 여는 방법
  showMenuShortcuts: boolean; // 메뉴 항목 옆에 단축키를 적을지 여부
};

export const DEFAULT_NODE_ACTION_LAB_CONFIG: NodeActionLabConfig = {
  menuTrigger: "contextMenu",
  showMenuShortcuts: false,
};

export const MENU_TRIGGER_OPTIONS: { value: MenuTrigger; label: string }[] = [
  { value: "contextMenu", label: "우클릭" },
  { value: "click", label: "클릭" },
  { value: "clickSelected", label: "다시 클릭" },
  { value: "off", label: "끄기" },
];
