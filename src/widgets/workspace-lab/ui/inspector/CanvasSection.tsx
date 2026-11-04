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

export function CanvasSection({ config, onChange }: InspectorSectionProps) {
  const currentCanvasStyle = getWorkspaceLabCanvasStyle(config.canvasStyle);

  return (
    <InspectorSection title="Canvas">
      <SelectField
        label="캔버스"
        value={config.canvasStyle}
        options={toSelectOptions(workspaceLabCanvasStyles)}
        onChange={(canvasStyle) => onChange({ canvasStyle })}
      />
      <FieldDescription>{currentCanvasStyle.description}</FieldDescription>
    </InspectorSection>
  );
}
