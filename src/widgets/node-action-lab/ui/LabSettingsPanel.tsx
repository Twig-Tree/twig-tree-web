import {
  MENU_TRIGGER_OPTIONS,
  type NodeActionLabConfig,
  SHORTCUT_PLATFORM_OPTIONS,
  TOOLBAR_POSITION_OPTIONS,
  TOOLBAR_STYLE_OPTIONS,
  TOOLBAR_VISIBILITY_OPTIONS,
  TOOLTIP_OPTIONS,
} from "../model/config";
import { type ShortcutPlatform } from "../model/shortcuts";

/*
노드 옆 버튼을 언제 보일지에 따라 키보드로 쓸 수 있는지가 달라진다. 고른 값 바로 아래에 적어 실험할 때 헷갈리지 않게 한다.
*/
const TOOLBAR_VISIBILITY_DESCRIPTIONS: Record<
  NodeActionLabConfig["toolbarVisibility"],
  string | undefined
> = {
  off: undefined,
  hover:
    "호버 버튼은 마우스로만 쓸 수 있습니다. 키보드로는 버튼에 들어갈 수 없습니다.",
  selected:
    "선택한 노드에서 Tab을 누르면 첫 버튼으로 갑니다. ←→로 오가고 Esc로 노드에 돌아옵니다.",
  hoverOrSelected:
    "선택한 노드의 버튼에만 Tab으로 들어갈 수 있습니다. 호버로 보인 버튼은 마우스로만 쓸 수 있습니다.",
};

type LabSettingsPanelProps = {
  config: NodeActionLabConfig;
  devicePlatform: ShortcutPlatform; // 접속한 기기의 운영체제. "이 기기" 선택지에 어느 운영체제인지 적는다
  onChangeConfig: (patch: Partial<NodeActionLabConfig>) => void; // 바꾼 값만 넘긴다. 합치는 일은 호출부가 이전 값을 기준으로 한다
};

type OptionGroupProps<Value extends string> = {
  label: string; // 선택지 묶음의 이름
  options: { value: Value; label: string }[];
  value: Value;
  description?: string; // 선택지 아래에 적을 설명
  onChange: (value: Value) => void;
};

/*
함수 이름 : OptionGroup
기능 : 하나만 고르는 선택지를 눌림 상태 버튼 묶음으로 그린다.
인자 : OptionGroupProps
반환값 : 선택지 버튼 묶음
*/
function OptionGroup<Value extends string>({
  label,
  options,
  value,
  description,
  onChange,
}: OptionGroupProps<Value>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-content-secondary">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap gap-1 rounded-control border border-line bg-surface p-1"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`h-7 flex-1 rounded-control px-2 text-xs font-bold whitespace-nowrap ${
              value === option.value
                ? "bg-accent text-on-accent"
                : "text-content-secondary hover:bg-surface-hover"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {description ? (
        <span className="text-xs text-content-muted">{description}</span>
      ) : null}
    </div>
  );
}

type ToggleOptionProps = {
  label: string;
  description?: string; // 켰을 때 무엇이 달라지는지
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/*
함수 이름 : ToggleOption
기능 : 켜고 끄는 선택지를 체크박스로 그린다.
인자 : ToggleOptionProps
반환값 : 체크박스와 설명
*/
function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: ToggleOptionProps) {
  return (
    <label className="flex items-start gap-2 text-xs text-content-secondary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 accent-accent"
      />
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="text-content-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

/*
함수 이름 : LabSettingsPanel
기능 : 실험실에서 켜고 끄는 진입 방식을 묶음별로 고르게 한다.
인자 : LabSettingsPanelProps
반환값 : 진입 방식 설정 패널
*/
export function LabSettingsPanel({
  config,
  devicePlatform,
  onChangeConfig,
}: LabSettingsPanelProps) {
  return (
    <section
      aria-labelledby="node-action-lab-settings"
      className="flex flex-col gap-3"
    >
      <h3
        id="node-action-lab-settings"
        className="text-xs font-bold text-content-secondary"
      >
        진입 방식
      </h3>
      <OptionGroup
        label="메뉴 여는 방법"
        options={MENU_TRIGGER_OPTIONS}
        value={config.menuTrigger}
        onChange={(menuTrigger) => onChangeConfig({ menuTrigger })}
      />
      <ToggleOption
        label="메뉴에 단축키 표기"
        checked={config.showMenuShortcuts}
        onChange={(showMenuShortcuts) => onChangeConfig({ showMenuShortcuts })}
      />

      <OptionGroup
        label="노드 옆 버튼"
        options={TOOLBAR_VISIBILITY_OPTIONS}
        value={config.toolbarVisibility}
        description={TOOLBAR_VISIBILITY_DESCRIPTIONS[config.toolbarVisibility]}
        onChange={(toolbarVisibility) => onChangeConfig({ toolbarVisibility })}
      />
      {config.toolbarVisibility === "off" ? null : (
        <>
          <OptionGroup
            label="버튼 위치"
            options={TOOLBAR_POSITION_OPTIONS}
            value={config.toolbarPosition}
            onChange={(toolbarPosition) => onChangeConfig({ toolbarPosition })}
          />
          <OptionGroup
            label="버튼 모양"
            options={TOOLBAR_STYLE_OPTIONS}
            value={config.toolbarStyle}
            onChange={(toolbarStyle) => onChangeConfig({ toolbarStyle })}
          />
          <OptionGroup
            label="툴팁"
            options={TOOLTIP_OPTIONS}
            value={config.tooltip}
            onChange={(tooltip) => onChangeConfig({ tooltip })}
          />
          {config.tooltip === "off" ? null : (
            <ToggleOption
              label="툴팁에 단축키 표기"
              checked={config.showTooltipShortcuts}
              onChange={(showTooltipShortcuts) =>
                onChangeConfig({ showTooltipShortcuts })
              }
            />
          )}
        </>
      )}

      <OptionGroup
        label="단축키 기준 운영체제"
        options={SHORTCUT_PLATFORM_OPTIONS.map((option) =>
          option.value === "auto"
            ? {
                ...option,
                label: `이 기기 (${devicePlatform === "mac" ? "Mac" : "Windows"})`,
              }
            : option,
        )}
        value={config.shortcutPlatform}
        description="노드를 하나 선택하면 단축키가 언제나 동작합니다."
        onChange={(shortcutPlatform) => onChangeConfig({ shortcutPlatform })}
      />
      <ToggleOption
        label="하단 힌트 줄"
        description="노드를 선택하면 쓸 수 있는 단축키를 캔버스 아래에 보여 줍니다."
        checked={config.showHintBar}
        onChange={(showHintBar) => onChangeConfig({ showHintBar })}
      />
      <ToggleOption
        label="?로 단축키 안내 열기"
        checked={config.showShortcutGuide}
        onChange={(showShortcutGuide) => onChangeConfig({ showShortcutGuide })}
      />
    </section>
  );
}
