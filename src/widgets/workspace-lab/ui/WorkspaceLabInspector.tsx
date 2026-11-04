import { getWorkspaceLabTheme } from "../model/themes";
import { AppearanceSection } from "./inspector/AppearanceSection";
import { ColorSection } from "./inspector/ColorSection";
import { ConnectionSection } from "./inspector/ConnectionSection";
import { NodeSection } from "./inspector/NodeSection";
import { PanelStyleSection } from "./inspector/PanelStyleSection";
import { RegionsSection } from "./inspector/RegionsSection";
import { ScenarioSection } from "./inspector/ScenarioSection";
import { StateSection } from "./inspector/StateSection";
import type { InspectorSectionProps } from "./inspector/types";

export function WorkspaceLabInspector({
  config,
  onChange,
}: InspectorSectionProps) {
  const currentTheme = getWorkspaceLabTheme(config.theme);

  return (
    <aside className="workspace-lab-inspector flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-5 py-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-indigo-600 uppercase">
          Inspector
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          Workspace UI
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {currentTheme.name}
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <ScenarioSection config={config} onChange={onChange} />
        <StateSection config={config} onChange={onChange} />
        <ColorSection config={config} onChange={onChange} />
        <AppearanceSection config={config} onChange={onChange} />
        <NodeSection config={config} onChange={onChange} />
        <ConnectionSection config={config} onChange={onChange} />
        <RegionsSection config={config} onChange={onChange} />
        <PanelStyleSection
          title="Left panel"
          visibleLabel="왼쪽 패널 표시"
          isVisible={config.showLeftPanel}
          panelStyle={config.leftPanelStyle}
          onVisibleChange={(showLeftPanel) => onChange({ showLeftPanel })}
          onPanelStyleChange={(leftPanelStyle) => onChange({ leftPanelStyle })}
        />
        <PanelStyleSection
          title="Memo panel"
          visibleLabel="메모 패널 표시"
          isVisible={config.showRightPanel}
          panelStyle={config.memoPanelStyle}
          onVisibleChange={(showRightPanel) => onChange({ showRightPanel })}
          onPanelStyleChange={(memoPanelStyle) => onChange({ memoPanelStyle })}
        />
      </div>
    </aside>
  );
}
