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
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import { DesignThemeSectionReset } from "./DesignThemeField";
import type { InspectorSectionProps } from "./types";

export function NodeSection({ config, onChange }: InspectorSectionProps) {
  const currentNodeShape = getWorkspaceLabNodeShape(config.nodeShape);
  const currentNodeDensity = getWorkspaceLabNodeDensity(config.density);
  const currentCollapseControlStyle = getWorkspaceLabCollapseControlStyle(
    config.collapseControlStyle,
  );

  return (
    <InspectorSection
      title="노드"
      action={
        <DesignThemeSectionReset
          config={config}
          onChange={onChange}
          section="node"
        />
      }
    >
      <SelectField
        label="노드 모양"
        value={config.nodeShape}
        options={toSelectOptions(workspaceLabNodeShapes)}
        onChange={(nodeShape) => onChange({ nodeShape })}
        description={currentNodeShape.description}
      />
      <SelectField
        label="노드 밀도"
        value={config.density}
        options={toSelectOptions(workspaceLabNodeDensities)}
        onChange={(density) => onChange({ density })}
        description={currentNodeDensity.description}
      />
      <SelectField
        label="접기 버튼"
        value={config.collapseControlStyle}
        options={toSelectOptions(workspaceLabCollapseControlStyles)}
        onChange={(collapseControlStyle) => onChange({ collapseControlStyle })}
        description={currentCollapseControlStyle.description}
      />
    </InspectorSection>
  );
}
