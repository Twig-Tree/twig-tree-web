import {
  getWorkspaceLabShapeStyle,
  workspaceLabShapeStyles,
} from "../../model/shape-styles";
import {
  FieldDescription,
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function ShapeSection({ config, onChange }: InspectorSectionProps) {
  const currentShapeStyle = getWorkspaceLabShapeStyle(config.shapeStyle);

  return (
    <InspectorSection title="Shape">
      <SelectField
        label="곡률과 그림자"
        value={config.shapeStyle}
        options={toSelectOptions(workspaceLabShapeStyles)}
        onChange={(shapeStyle) => onChange({ shapeStyle })}
      />
      <FieldDescription>{currentShapeStyle.description}</FieldDescription>
    </InspectorSection>
  );
}
