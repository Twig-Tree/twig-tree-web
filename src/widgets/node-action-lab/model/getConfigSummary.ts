import {
  MENU_TRIGGER_OPTIONS,
  type NodeActionLabConfig,
  SHORTCUT_PLATFORM_OPTIONS,
  TOOLBAR_POSITION_OPTIONS,
  TOOLBAR_STYLE_OPTIONS,
  TOOLBAR_VISIBILITY_OPTIONS,
  TOOLTIP_OPTIONS,
} from "./config";
import { type ShortcutPlatform } from "./shortcuts";

/*
함수 이름 : getOptionLabel
기능 : 선택지 목록에서 값에 맞는 표기를 찾는다.
인자 : { value: Value; label: string }[] options -> 선택지 목록
Value value -> 고른 값
반환값 : 선택지 표기. 목록에 없으면 값 그대로
*/
const getOptionLabel = <Value extends string>(
  options: { value: Value; label: string }[],
  value: Value,
) => options.find((option) => option.value === value)?.label ?? value;

const getToggleLabel = (checked: boolean) => (checked ? "켬" : "끔");

/*
함수 이름 : getConfigSummary
기능 : 지금 실험실 설정을 설정 패널과 같은 이름으로 한 줄씩 적고, 그 아래에 설정 객체를 JSON으로 붙인다.
인자 : NodeActionLabConfig config -> 지금 설정
ShortcutPlatform platform -> "이 기기"가 실제로 어느 운영체제인지 적기 위한 값
반환값 : 복사해 붙여 넣을 설정 요약

사람이 읽는 줄과 값을 그대로 되살릴 JSON을 함께 둔다. 화면에 보이지 않는 하위 설정(버튼을 끈 때의 위치 등)은 줄에서 빼지만 JSON에는 남긴다.
*/
export const getConfigSummary = (
  config: NodeActionLabConfig,
  platform: ShortcutPlatform,
): string => {
  const platformLabel =
    config.shortcutPlatform === "auto"
      ? `이 기기 (${platform === "mac" ? "Mac" : "Windows"})`
      : getOptionLabel(SHORTCUT_PLATFORM_OPTIONS, config.shortcutPlatform);

  const lines = [
    `메뉴 여는 방법: ${getOptionLabel(MENU_TRIGGER_OPTIONS, config.menuTrigger)}`,
    `메뉴에 단축키 표기: ${getToggleLabel(config.showMenuShortcuts)}`,
    `노드 옆 버튼: ${getOptionLabel(TOOLBAR_VISIBILITY_OPTIONS, config.toolbarVisibility)}`,
  ];

  if (config.toolbarVisibility !== "off") {
    lines.push(
      `버튼 위치: ${getOptionLabel(TOOLBAR_POSITION_OPTIONS, config.toolbarPosition)}`,
      `버튼 모양: ${getOptionLabel(TOOLBAR_STYLE_OPTIONS, config.toolbarStyle)}`,
      `툴팁: ${getOptionLabel(TOOLTIP_OPTIONS, config.tooltip)}`,
    );

    if (config.tooltip !== "off") {
      lines.push(
        `툴팁에 단축키 표기: ${getToggleLabel(config.showTooltipShortcuts)}`,
      );
    }
  }

  lines.push(
    `단축키 기준 운영체제: ${platformLabel}`,
    `하단 힌트 줄: ${getToggleLabel(config.showHintBar)}`,
    `?로 단축키 안내 열기: ${getToggleLabel(config.showShortcutGuide)}`,
  );

  return [
    "Node Action Lab 설정",
    ...lines.map((line) => `- ${line}`),
    "",
    JSON.stringify(config),
  ].join("\n");
};
