import {
  getWorkspaceLabLayout,
  getWorkspaceLabLayoutSpacing,
  workspaceLabLayouts,
  workspaceLabLayoutSpacings,
} from "../../model/layouts";
import {
  getWorkspaceLabScenario,
  workspaceLabScenarios,
} from "../../model/scenarios";
import {
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function ScenarioSection({ config, onChange }: InspectorSectionProps) {
  const currentScenario = getWorkspaceLabScenario(config.scenarioId);
  const currentLayout = getWorkspaceLabLayout(config.layoutMode);
  const currentLayoutSpacing = getWorkspaceLabLayoutSpacing(
    config.layoutSpacing,
  );

  return (
    <InspectorSection title="Scenario" isFirst>
      <SelectField
        label="트리 구성"
        value={config.scenarioId}
        options={workspaceLabScenarios.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        onChange={(scenarioId) => onChange({ scenarioId })}
      />
      <SelectField
        label="트리 전개"
        value={config.layoutMode}
        options={toSelectOptions(workspaceLabLayouts)}
        onChange={(layoutMode) => onChange({ layoutMode })}
      />
      <SelectField
        label="배치 간격"
        value={config.layoutSpacing}
        options={toSelectOptions(workspaceLabLayoutSpacings)}
        onChange={(layoutSpacing) => onChange({ layoutSpacing })}
      />
      <p className="text-xs leading-5 text-slate-500">
        {currentScenario.description}
      </p>
      <p className="text-xs leading-5 text-slate-500">
        {currentLayout.description}
      </p>
      <p className="text-xs leading-5 text-slate-500">
        {currentLayoutSpacing.description}
      </p>
    </InspectorSection>
  );
}
