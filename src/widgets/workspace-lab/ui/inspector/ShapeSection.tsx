import {
  getWorkspaceLabShapeStyle,
  workspaceLabShapeStyles,
} from "../../model/shape-styles";
import {
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import { DesignThemeSectionReset } from "./DesignThemeField";
import type { InspectorSectionProps } from "./types";

export function ShapeSection({ config, onChange }: InspectorSectionProps) {
  const currentShapeStyle = getWorkspaceLabShapeStyle(config.shapeStyle);

  return (
    <InspectorSection
      title="형태"
      action={
        <DesignThemeSectionReset
          config={config}
          onChange={onChange}
          section="shape"
        />
      }
    >
      <SelectField
        label="곡률과 그림자"
        value={config.shapeStyle}
        options={toSelectOptions(workspaceLabShapeStyles)}
        onChange={(shapeStyle) => onChange({ shapeStyle })}
        description={currentShapeStyle.description}
      />
    </InspectorSection>
  );
}
