import {
  getMatchingPresetId,
  NODE_ACTION_LAB_PRESETS,
  type NodeActionLabPreset,
} from "../model/presets";
import { type NodeActionLabConfig } from "../model/config";

type LabPresetPickerProps = {
  config: NodeActionLabConfig; // 지금 설정. 똑같은 프리셋을 눌린 상태로 보여 준다
  onApply: (preset: NodeActionLabPreset) => void;
};

/*
함수 이름 : LabPresetPicker
기능 : 비교할 진입 방식 조합을 한 번에 고르는 버튼을 그린다. 지금 설정과 똑같은 프리셋은 눌린 상태로 두고 설명을 적는다.
인자 : LabPresetPickerProps
반환값 : 프리셋 버튼 묶음
*/
export function LabPresetPicker({ config, onApply }: LabPresetPickerProps) {
  const matchingPresetId = getMatchingPresetId(config);
  const matchingPreset = NODE_ACTION_LAB_PRESETS.find(
    (preset) => preset.id === matchingPresetId,
  );

  return (
    <section
      aria-labelledby="node-action-lab-presets"
      className="flex flex-col gap-2"
    >
      <h3
        id="node-action-lab-presets"
        className="text-xs font-bold text-content-secondary"
      >
        프리셋
      </h3>
      <div className="grid grid-cols-2 gap-1">
        {NODE_ACTION_LAB_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={preset.id === matchingPresetId}
            title={preset.description}
            onClick={() => onApply(preset)}
            className={`h-8 rounded-control border px-2 text-left text-xs font-bold whitespace-nowrap ${
              preset.id === matchingPresetId
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-surface text-content-secondary hover:bg-surface-hover"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-content-muted">
        {matchingPreset
          ? matchingPreset.description
          : "프리셋에서 설정을 바꾼 상태입니다."}
      </p>
    </section>
  );
}
