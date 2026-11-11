import {
  MENU_TRIGGER_OPTIONS,
  type NodeActionLabConfig,
} from "../model/config";

type LabSettingsPanelProps = {
  config: NodeActionLabConfig;
  onChangeConfig: (config: NodeActionLabConfig) => void;
};

type OptionGroupProps<Value extends string> = {
  label: string; // 선택지 묶음의 이름
  options: { value: Value; label: string }[];
  value: Value;
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
    </div>
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
        onChange={(menuTrigger) => onChangeConfig({ ...config, menuTrigger })}
      />
    </section>
  );
}
