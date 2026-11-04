import { InspectorSection, SegmentedField, Toggle } from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function RegionsSection({ config, onChange }: InspectorSectionProps) {
  return (
    <InspectorSection title="Regions">
      <SegmentedField
        label="뷰포트"
        value={config.viewport}
        options={[
          { value: "desktop", label: "Desktop" },
          { value: "compact", label: "Compact" },
        ]}
        onChange={(viewport) => onChange({ viewport })}
      />
      <Toggle
        label="플로팅 툴바"
        checked={config.showToolbar}
        onChange={(showToolbar) => onChange({ showToolbar })}
      />
      <Toggle
        label="하단 플레이어"
        checked={config.showPlayer}
        onChange={(showPlayer) => onChange({ showPlayer })}
      />
    </InspectorSection>
  );
}
