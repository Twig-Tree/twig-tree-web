import {
  getWorkspaceLabCanvasStyle,
  workspaceLabCanvasStyles,
} from "../../model/visual-slots";
import {
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import { DesignThemeSectionReset } from "./DesignThemeField";
import type { InspectorSectionProps } from "./types";

export function CanvasSection({ config, onChange }: InspectorSectionProps) {
  const currentCanvasStyle = getWorkspaceLabCanvasStyle(config.canvasStyle);

  return (
    <InspectorSection
      title="캔버스"
      action={
        <DesignThemeSectionReset
          config={config}
          onChange={onChange}
          section="canvas"
        />
      }
    >
      <SelectField
        label="캔버스"
        value={config.canvasStyle}
        options={toSelectOptions(workspaceLabCanvasStyles)}
        onChange={(canvasStyle) => onChange({ canvasStyle })}
        description={currentCanvasStyle.description}
      />
    </InspectorSection>
  );
}
