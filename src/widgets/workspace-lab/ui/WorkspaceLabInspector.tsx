import { useState } from "react";
import { getWorkspaceLabColorTheme } from "../model/color-themes";
import { CanvasSection } from "./inspector/CanvasSection";
import { ColorSection } from "./inspector/ColorSection";
import { ConnectionSection } from "./inspector/ConnectionSection";
import { InspectorTabs, type InspectorTab } from "./inspector/InspectorTabs";
import { LayoutSection } from "./inspector/LayoutSection";
import { NodeSection } from "./inspector/NodeSection";
import { PanelStyleSection } from "./inspector/PanelStyleSection";
import { RegionsSection } from "./inspector/RegionsSection";
import { ScenarioSection } from "./inspector/ScenarioSection";
import { ShapeSection } from "./inspector/ShapeSection";
import { StateSection } from "./inspector/StateSection";
import type { InspectorSectionProps } from "./inspector/types";

type InspectorTabId = "structure" | "style" | "regions";

export function WorkspaceLabInspector({
  config,
  onChange,
}: InspectorSectionProps) {
  const [activeTab, setActiveTab] = useState<InspectorTabId>("structure");
  const currentTheme = getWorkspaceLabColorTheme(config.colorTheme);
  const sectionProps = { config, onChange };

  /*
  탭은 "무엇을 결정하는가"로 나눈다. 구조는 어떤 트리를 어떻게 펼칠지,
  스타일은 트리를 어떻게 그릴지, 화면 영역은 트리 주변에 무엇을 둘지를 정한다.
  */
  const tabs: ReadonlyArray<InspectorTab<InspectorTabId>> = [
    {
      id: "structure",
      label: "구조",
      content: (
        <>
          <ScenarioSection {...sectionProps} />
          <LayoutSection {...sectionProps} />
          <StateSection {...sectionProps} />
        </>
      ),
    },
    {
      id: "style",
      label: "스타일",
      content: (
        <>
          <ColorSection {...sectionProps} />
          <ShapeSection {...sectionProps} />
          <CanvasSection {...sectionProps} />
          <NodeSection {...sectionProps} />
          <ConnectionSection {...sectionProps} />
        </>
      ),
    },
    {
      id: "regions",
      label: "화면 영역",
      content: (
        <>
          <RegionsSection {...sectionProps} />
          <PanelStyleSection
            title="Left panel"
            visibleLabel="왼쪽 패널 표시"
            isVisible={config.showLeftPanel}
            panelStyle={config.leftPanelStyle}
            onVisibleChange={(showLeftPanel) => onChange({ showLeftPanel })}
            onPanelStyleChange={(leftPanelStyle) =>
              onChange({ leftPanelStyle })
            }
          />
          <PanelStyleSection
            title="Memo panel"
            visibleLabel="메모 패널 표시"
            isVisible={config.showRightPanel}
            panelStyle={config.memoPanelStyle}
            onVisibleChange={(showRightPanel) => onChange({ showRightPanel })}
            onPanelStyleChange={(memoPanelStyle) =>
              onChange({ memoPanelStyle })
            }
          />
        </>
      ),
    },
  ];

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

      <InspectorTabs
        tabs={tabs}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
      />
    </aside>
  );
}
