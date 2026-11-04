import { InspectorSection, Toggle } from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function RegionsSection({ config, onChange }: InspectorSectionProps) {
  return (
    <InspectorSection title="Regions">
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
