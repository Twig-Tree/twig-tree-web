import { type ShortcutPlatform } from "./shortcuts";

/*
노드 동작 메뉴를 여는 방법. 한 번에 하나만 켜서 방식끼리 섞이지 않게 비교한다.
- contextMenu: 노드를 우클릭한다. 지금 제품과 같다
- click: 노드를 한 번 누른다
- clickSelected: 이미 선택된 노드를 다시 누른다. 첫 클릭은 선택만 한다
*/
export type MenuTrigger = "contextMenu" | "click" | "clickSelected" | "off";

export type MenuEntry = Exclude<MenuTrigger, "off">; // 메뉴가 열린 방법. 실행 기록의 진입점이 된다

/*
노드 옆 버튼이 보이는 때. hover는 마우스로만 볼 수 있고, selected는 키보드로 노드를 골라도 보인다.
*/
export type ToolbarVisibility =
  | "off"
  | "hover"
  | "selected"
  | "hoverOrSelected";

export type ToolbarPosition = "right" | "bottom" | "top";

export type ToolbarStyle = "icon" | "iconLabel";

export type TooltipContent = "off" | "label";

/*
선택된 노드에서 노드 옆 버튼으로 키보드 focus를 옮기는 키. 버튼은 모든 노드 뒤에 그려져 Tab 순서로는 닿지 않으므로
노드에서 Tab을 누르면 그 노드의 첫 버튼으로 보낸다. 자식 추가는 →라 Tab과 겹치지 않는다.
*/
export const TOOLBAR_ENTRY_KEY = "Tab";

/*
단축키 표를 고를 운영체제. auto는 접속한 기기를 따르고, 나머지는 다른 운영체제의 표를 미리 볼 때 쓴다.
*/
export type ShortcutPlatformSetting = "auto" | ShortcutPlatform;

/*
실험실에서 켜고 끄는 진입 방식의 묶음. 프리셋은 이 객체의 값 묶음이다.
단축키는 비교 대상이 아니라 언제나 동작한다. 끌 수 있으면 새로고침 뒤 꺼진 기본값으로 돌아가 동작하지 않는 것처럼 보인다.
*/
export type NodeActionLabConfig = {
  menuTrigger: MenuTrigger; // 노드 동작 메뉴를 여는 방법
  showMenuShortcuts: boolean; // 메뉴 항목 옆에 단축키를 적을지 여부
  toolbarVisibility: ToolbarVisibility; // 노드 옆 버튼이 보이는 때
  toolbarPosition: ToolbarPosition; // 노드 옆 버튼이 붙는 쪽
  toolbarStyle: ToolbarStyle; // 버튼에 글자를 함께 적을지 여부
  tooltip: TooltipContent; // 버튼에 마우스를 올리거나 focus했을 때 보여 줄 내용
  showTooltipShortcuts: boolean; // 툴팁에 단축키를 함께 적을지 여부
  shortcutPlatform: ShortcutPlatformSetting; // 단축키 표를 고를 운영체제
  showHintBar: boolean; // 노드를 선택하면 쓸 수 있는 단축키를 화면 아래에 보여 줄지 여부
  showShortcutGuide: boolean; // ?로 단축키 목록을 열 수 있게 할지 여부
};

export const DEFAULT_NODE_ACTION_LAB_CONFIG: NodeActionLabConfig = {
  menuTrigger: "contextMenu",
  showMenuShortcuts: false,
  toolbarVisibility: "off",
  toolbarPosition: "right",
  toolbarStyle: "icon",
  tooltip: "label",
  showTooltipShortcuts: true,
  shortcutPlatform: "auto",
  showHintBar: false,
  showShortcutGuide: false,
};

export const SHORTCUT_PLATFORM_OPTIONS: {
  value: ShortcutPlatformSetting;
  label: string;
}[] = [
  { value: "auto", label: "이 기기" },
  { value: "mac", label: "Mac" },
  { value: "windows", label: "Windows" },
];

export const TOOLBAR_VISIBILITY_OPTIONS: {
  value: ToolbarVisibility;
  label: string;
}[] = [
  { value: "off", label: "끄기" },
  { value: "hover", label: "호버" },
  { value: "selected", label: "선택" },
  { value: "hoverOrSelected", label: "둘 다" },
];

export const TOOLBAR_POSITION_OPTIONS: {
  value: ToolbarPosition;
  label: string;
}[] = [
  { value: "right", label: "오른쪽" },
  { value: "bottom", label: "아래" },
  { value: "top", label: "위" },
];

export const TOOLBAR_STYLE_OPTIONS: { value: ToolbarStyle; label: string }[] = [
  { value: "icon", label: "아이콘" },
  { value: "iconLabel", label: "아이콘 + 글자" },
];

export const TOOLTIP_OPTIONS: { value: TooltipContent; label: string }[] = [
  { value: "off", label: "끄기" },
  { value: "label", label: "이름" },
];

export const MENU_TRIGGER_OPTIONS: { value: MenuTrigger; label: string }[] = [
  { value: "contextMenu", label: "우클릭" },
  { value: "click", label: "클릭" },
  { value: "clickSelected", label: "다시 클릭" },
  { value: "off", label: "끄기" },
];

/*
함수 이름 : hasKeyboardToolbar
기능 : 선택된 노드에 노드 옆 버튼이 붙어 키보드로 들어갈 수 있는지 판단한다.
인자 : ToolbarVisibility visibility -> 노드 옆 버튼이 보이는 때
반환값 : 들어갈 수 있으면 true

호버로만 보이는 버튼은 마우스를 위한 것이라 키보드로 들어갈 대상이 없다.
*/
export const hasKeyboardToolbar = (visibility: ToolbarVisibility): boolean =>
  visibility === "selected" || visibility === "hoverOrSelected";
