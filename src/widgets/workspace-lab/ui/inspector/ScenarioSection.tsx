import {
  getWorkspaceLabScenario,
  workspaceLabScenarios,
} from "../../model/scenarios";
import { InspectorSection, SelectField } from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

export function ScenarioSection({ config, onChange }: InspectorSectionProps) {
  const currentScenario = getWorkspaceLabScenario(config.scenarioId);

  return (
    <InspectorSection title="Scenario">
      <SelectField
        label="트리 구성"
        value={config.scenarioId}
        options={workspaceLabScenarios.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        onChange={(scenarioId) => onChange({ scenarioId })}
        description={currentScenario.description}
      />
    </InspectorSection>
  );
}
