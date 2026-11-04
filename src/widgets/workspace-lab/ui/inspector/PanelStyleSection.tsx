import {
  getWorkspaceLabPanelBorder,
  getWorkspaceLabPanelPlacement,
  getWorkspaceLabPanelSurface,
  workspaceLabPanelBorders,
  workspaceLabPanelDensities,
  workspaceLabPanelPlacements,
  workspaceLabPanelSurfaces,
  workspaceLabPanelWidths,
} from "../../model/panels";
import type { LabPanelStyle } from "../../model/types";
import {
  FieldDescription,
  InspectorSection,
  SelectField,
  Toggle,
  toSelectOptions,
} from "./InspectorFields";

type PanelStyleSectionProps = {
  title: string; // Inspector 구획 제목
  visibleLabel: string; // 패널 표시 토글 이름
  isVisible: boolean; // 미리보기에 패널을 그리는지 여부
  panelStyle: LabPanelStyle; // 패널의 현재 디자인 선택값
  onVisibleChange: (value: boolean) => void;
  onPanelStyleChange: (value: LabPanelStyle) => void;
};

export function PanelStyleSection({
  title,
  visibleLabel,
  isVisible,
  panelStyle,
  onVisibleChange,
  onPanelStyleChange,
}: PanelStyleSectionProps) {
  const currentPlacement = getWorkspaceLabPanelPlacement(panelStyle.placement);
  const currentSurface = getWorkspaceLabPanelSurface(panelStyle.surface);
  const currentBorder = getWorkspaceLabPanelBorder(panelStyle.border);

  return (
    <InspectorSection title={title}>
      <Toggle
        label={visibleLabel}
        checked={isVisible}
        onChange={onVisibleChange}
      />
      {isVisible ? (
        <>
          <SelectField
            label="배치"
            value={panelStyle.placement}
            options={toSelectOptions(workspaceLabPanelPlacements)}
            onChange={(placement) =>
              onPanelStyleChange({ ...panelStyle, placement })
            }
          />
          <FieldDescription>{currentPlacement.description}</FieldDescription>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="너비"
              value={panelStyle.width}
              options={toSelectOptions(workspaceLabPanelWidths)}
              onChange={(width) => onPanelStyleChange({ ...panelStyle, width })}
            />
            <SelectField
              label="밀도"
              value={panelStyle.density}
              options={toSelectOptions(workspaceLabPanelDensities)}
              onChange={(density) =>
                onPanelStyleChange({ ...panelStyle, density })
              }
            />
            <SelectField
              label="표면"
              value={panelStyle.surface}
              options={toSelectOptions(workspaceLabPanelSurfaces)}
              onChange={(surface) =>
                onPanelStyleChange({ ...panelStyle, surface })
              }
            />
            <SelectField
              label="경계"
              value={panelStyle.border}
              options={toSelectOptions(workspaceLabPanelBorders)}
              onChange={(border) =>
                onPanelStyleChange({ ...panelStyle, border })
              }
            />
          </div>
          <FieldDescription>
            {currentSurface.description} {currentBorder.description}
          </FieldDescription>
        </>
      ) : null}
    </InspectorSection>
  );
}
