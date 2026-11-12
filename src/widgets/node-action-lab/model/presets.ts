import {
  DEFAULT_NODE_ACTION_LAB_CONFIG,
  type NodeActionLabConfig,
} from "./config";

/*
프리셋이 정하는 설정. 단축키 기준 운영체제는 진입 방식이 아니라 보는 사람의 기기 문제라 프리셋을 골라도 바꾸지 않는다.
*/
type PresetConfig = Omit<NodeActionLabConfig, "shortcutPlatform">;

export type NodeActionLabPreset = {
  id: string;
  label: string;
  description: string; // 어떤 조합인지 한 줄로 적는다
  config: PresetConfig;
};

/*
함수 이름 : omitShortcutPlatform
기능 : 설정에서 프리셋이 정하지 않는 단축키 기준 운영체제를 뺀다.
인자 : NodeActionLabConfig config -> 실험실 설정
반환값 : 프리셋이 정하는 설정
*/
const omitShortcutPlatform = (config: NodeActionLabConfig): PresetConfig => {
  const presetConfig: Partial<NodeActionLabConfig> = { ...config };
  delete presetConfig.shortcutPlatform;

  return presetConfig as PresetConfig;
};

const DEFAULT_PRESET_CONFIG = omitShortcutPlatform(
  DEFAULT_NODE_ACTION_LAB_CONFIG,
);

/*
계획서에서 비교하기로 한 조합. 단축키는 모든 프리셋에서 동작하고, 프리셋은 그 단축키를 어떻게 알리고 동작을 어디서 찾게 하는지가 다르다.
*/
export const NODE_ACTION_LAB_PRESETS: NodeActionLabPreset[] = [
  {
    id: "product",
    label: "지금 제품",
    description: "우클릭 메뉴만 있다.",
    config: DEFAULT_PRESET_CONFIG,
  },
  {
    id: "clickMenu",
    label: "A. 클릭 메뉴",
    description: "노드를 누르면 메뉴가 열리고 단축키가 적혀 있다.",
    config: {
      ...DEFAULT_PRESET_CONFIG,
      menuTrigger: "click",
      showMenuShortcuts: true,
    },
  },
  {
    id: "hoverToolbar",
    label: "B. 호버 버튼",
    description: "마우스를 올리면 아이콘 버튼이 뜨고 툴팁에 단축키가 있다.",
    config: {
      ...DEFAULT_PRESET_CONFIG,
      toolbarVisibility: "hover",
      toolbarPosition: "right",
      toolbarStyle: "icon",
      tooltip: "label",
      showTooltipShortcuts: true,
    },
  },
  {
    id: "selectedToolbar",
    label: "C. 선택 툴바",
    description:
      "선택한 노드 아래에 글자 버튼이 붙고, 아래 힌트 줄에 단축키가 있다.",
    config: {
      ...DEFAULT_PRESET_CONFIG,
      toolbarVisibility: "selected",
      toolbarPosition: "bottom",
      toolbarStyle: "iconLabel",
      tooltip: "label",
      showTooltipShortcuts: true,
      showHintBar: true,
    },
  },
  {
    id: "keyboard",
    label: "D. 키보드 중심",
    description:
      "메뉴는 우클릭 그대로 두고, 메뉴 단축키 표기·힌트 줄·단축키 안내로 키보드를 알린다.",
    config: {
      ...DEFAULT_PRESET_CONFIG,
      showMenuShortcuts: true,
      showHintBar: true,
      showShortcutGuide: true,
    },
  },
];

/*
함수 이름 : applyPreset
기능 : 프리셋의 설정을 적용한 새 설정을 만든다. 단축키 기준 운영체제는 지금 값을 유지한다.
인자 : NodeActionLabConfig current -> 지금 설정
NodeActionLabPreset preset -> 적용할 프리셋
반환값 : 프리셋을 적용한 설정
*/
export const applyPreset = (
  current: NodeActionLabConfig,
  preset: NodeActionLabPreset,
): NodeActionLabConfig => ({
  ...preset.config,
  shortcutPlatform: current.shortcutPlatform,
});

/*
함수 이름 : getMatchingPresetId
기능 : 지금 설정과 똑같은 프리셋을 찾는다. 단축키 기준 운영체제는 비교하지 않는다.
인자 : NodeActionLabConfig config -> 지금 설정
반환값 : 맞는 프리셋 ID, 프리셋에서 하나라도 바꿨으면 null
*/
export const getMatchingPresetId = (
  config: NodeActionLabConfig,
): string | null => {
  const comparable = omitShortcutPlatform(config);

  const preset = NODE_ACTION_LAB_PRESETS.find((candidate) =>
    (Object.keys(candidate.config) as (keyof PresetConfig)[]).every(
      (key) => candidate.config[key] === comparable[key],
    ),
  );

  return preset?.id ?? null;
};
