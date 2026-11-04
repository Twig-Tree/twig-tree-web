import {
  getWorkspaceLabNodeShape,
  workspaceLabNodeShapes,
} from "../../model/node-shapes";
import {
  getWorkspaceLabCollapseControlStyle,
  getWorkspaceLabNodeDensity,
  workspaceLabCollapseControlStyles,
  workspaceLabNodeDensities,
} from "../../model/visual-slots";
import {
  FieldDescription,
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function NodeSection({ config, onChange }: InspectorSectionProps) {
  const currentNodeShape = getWorkspaceLabNodeShape(config.nodeShape);
  const currentNodeDensity = getWorkspaceLabNodeDensity(config.density);
  const currentCollapseControlStyle = getWorkspaceLabCollapseControlStyle(
    config.collapseControlStyle,
  );

  return (
    <InspectorSection title="Node">
      <SelectField
        label="노드 모양"
        value={config.nodeShape}
        options={toSelectOptions(workspaceLabNodeShapes)}
        onChange={(nodeShape) => onChange({ nodeShape })}
      />
      <FieldDescription>{currentNodeShape.description}</FieldDescription>
      <SelectField
        label="노드 밀도"
        value={config.density}
        options={toSelectOptions(workspaceLabNodeDensities)}
        onChange={(density) => onChange({ density })}
      />
      <FieldDescription>{currentNodeDensity.description}</FieldDescription>
      <SelectField
        label="접기 버튼"
        value={config.collapseControlStyle}
        options={toSelectOptions(workspaceLabCollapseControlStyles)}
        onChange={(collapseControlStyle) => onChange({ collapseControlStyle })}
      />
      <FieldDescription>
        {currentCollapseControlStyle.description}
      </FieldDescription>
    </InspectorSection>
  );
}
