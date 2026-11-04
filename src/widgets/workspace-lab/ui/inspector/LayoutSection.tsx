import {
  getWorkspaceLabLayout,
  getWorkspaceLabLayoutSpacing,
  workspaceLabLayouts,
  workspaceLabLayoutSpacings,
} from "../../model/layouts";
import {
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function LayoutSection({ config, onChange }: InspectorSectionProps) {
  const currentLayout = getWorkspaceLabLayout(config.layoutMode);
  const currentLayoutSpacing = getWorkspaceLabLayoutSpacing(
    config.layoutSpacing,
  );

  return (
    <InspectorSection title="Layout">
      <SelectField
        label="트리 전개"
        value={config.layoutMode}
        options={toSelectOptions(workspaceLabLayouts)}
        onChange={(layoutMode) => onChange({ layoutMode })}
        description={currentLayout.description}
      />
      <SelectField
        label="배치 간격"
        value={config.layoutSpacing}
        options={toSelectOptions(workspaceLabLayoutSpacings)}
        onChange={(layoutSpacing) => onChange({ layoutSpacing })}
        description={currentLayoutSpacing.description}
      />
    </InspectorSection>
  );
}
