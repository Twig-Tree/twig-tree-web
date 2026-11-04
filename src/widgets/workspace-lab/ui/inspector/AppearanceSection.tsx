import {
  getWorkspaceLabCanvasStyle,
  workspaceLabCanvasStyles,
} from "../../model/visual-slots";
import {
  FieldDescription,
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function AppearanceSection({ config, onChange }: InspectorSectionProps) {
  const currentCanvasStyle = getWorkspaceLabCanvasStyle(config.canvasStyle);

  return (
    <InspectorSection title="Appearance">
      <SelectField
        label="캔버스"
        value={config.canvasStyle}
        options={toSelectOptions(workspaceLabCanvasStyles)}
        onChange={(canvasStyle) => onChange({ canvasStyle })}
      />
      <FieldDescription>{currentCanvasStyle.description}</FieldDescription>
      <SelectField
        label="뷰포트"
        value={config.viewport}
        options={[
          { value: "desktop", label: "Desktop" },
          { value: "compact", label: "Compact" },
        ]}
        onChange={(viewport) => onChange({ viewport })}
      />
    </InspectorSection>
  );
}
