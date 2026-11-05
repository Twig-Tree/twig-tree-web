import { useState } from "react";
import {
  getMatchingWorkspaceLabEdgeStylePresetId,
  getWorkspaceLabEdgeEffect,
  getWorkspaceLabEdgeMarker,
  getWorkspaceLabEdgeLineStyle,
  getWorkspaceLabEdgeStylePreset,
  workspaceLabEdgeColors,
  workspaceLabEdgeEffects,
  workspaceLabEdgeMarkers,
  workspaceLabEdgeLineStyles,
  workspaceLabEdgeOpacities,
  workspaceLabEdgePatterns,
  workspaceLabEdgeStylePresets,
  workspaceLabEdgeThicknesses,
  type WorkspaceLabEdgeStylePresetId,
  type WorkspaceLabEdgeStylePresetSelection,
} from "../../model/edge-styles";
import type { LabEdgeStyle } from "../../model/types";
import {
  getWorkspaceLabConnectionPointStyle,
  workspaceLabConnectionPointStyles,
} from "../../model/visual-slots";
import {
  DisclosureButton,
  InspectorSection,
  SelectField,
  toSelectOptions,
} from "./InspectorFields";
import { DesignThemeSectionReset } from "./DesignThemeField";
import type { InspectorSectionProps } from "./types";

export function ConnectionSection({ config, onChange }: InspectorSectionProps) {
  const { edgeStyle, connectionPointStyle } = config;
  const [showCustomEdgeStyle, setShowCustomEdgeStyle] = useState(false);
  const currentEdgeLineStyle = getWorkspaceLabEdgeLineStyle(
    edgeStyle.lineStyle,
  );
  const currentEdgeEffect = getWorkspaceLabEdgeEffect(edgeStyle.effect);
  const currentEdgePresetId =
    getMatchingWorkspaceLabEdgeStylePresetId(edgeStyle);
  const currentEdgePreset =
    currentEdgePresetId === "custom"
      ? null
      : getWorkspaceLabEdgeStylePreset(currentEdgePresetId);
  const currentConnectionPointStyle =
    getWorkspaceLabConnectionPointStyle(connectionPointStyle);

  const onEdgeStyleChange = (nextEdgeStyle: LabEdgeStyle) =>
    onChange({ edgeStyle: nextEdgeStyle });

  const handleEdgePresetChange = (
    presetId: WorkspaceLabEdgeStylePresetSelection,
  ) => {
    if (presetId === "custom") {
      setShowCustomEdgeStyle(true);
      return;
    }

    onEdgeStyleChange({
      ...getWorkspaceLabEdgeStylePreset(
        presetId as WorkspaceLabEdgeStylePresetId,
      ).values,
    });
  };

  return (
    <InspectorSection
      title="연결선"
      action={
        <DesignThemeSectionReset
          config={config}
          onChange={onChange}
          section="connection"
        />
      }
    >
      <SelectField
        label="제안 스타일"
        value={currentEdgePresetId}
        options={[
          ...workspaceLabEdgeStylePresets.map((item) => ({
            value: item.id,
            label: item.name,
          })),
          { value: "custom" as const, label: "커스텀" },
        ]}
        onChange={handleEdgePresetChange}
        description={
          currentEdgePreset?.description ??
          "세부 속성을 직접 조합한 커스텀 스타일입니다."
        }
      />

      <DisclosureButton
        label="커스텀 설정"
        isOpen={showCustomEdgeStyle}
        controls="workspace-lab-edge-custom-controls"
        onToggle={() => setShowCustomEdgeStyle((current) => !current)}
      />

      {showCustomEdgeStyle ? (
        <div
          id="workspace-lab-edge-custom-controls"
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
        >
          <SelectField
            label="선 형태"
            value={edgeStyle.lineStyle}
            options={toSelectOptions(workspaceLabEdgeLineStyles)}
            onChange={(lineStyle) =>
              onEdgeStyleChange({ ...edgeStyle, lineStyle })
            }
            description={currentEdgeLineStyle.description}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="패턴"
              value={edgeStyle.pattern}
              options={toSelectOptions(workspaceLabEdgePatterns)}
              onChange={(pattern) =>
                onEdgeStyleChange({ ...edgeStyle, pattern })
              }
            />
            <SelectField
              label="두께"
              value={edgeStyle.thickness}
              options={toSelectOptions(workspaceLabEdgeThicknesses)}
              onChange={(thickness) =>
                onEdgeStyleChange({ ...edgeStyle, thickness })
              }
            />
            <SelectField
              label="색상"
              value={edgeStyle.color}
              options={toSelectOptions(workspaceLabEdgeColors)}
              onChange={(color) => onEdgeStyleChange({ ...edgeStyle, color })}
            />
            <SelectField
              label="투명도"
              value={edgeStyle.opacity}
              options={toSelectOptions(workspaceLabEdgeOpacities)}
              onChange={(opacity) =>
                onEdgeStyleChange({ ...edgeStyle, opacity })
              }
            />
          </div>
          <SelectField
            label="특수 효과"
            value={edgeStyle.effect}
            options={toSelectOptions(workspaceLabEdgeEffects)}
            onChange={(effect) => onEdgeStyleChange({ ...edgeStyle, effect })}
            description={currentEdgeEffect.description}
          />
          <SelectField
            label="끝 모양"
            value={edgeStyle.marker}
            options={toSelectOptions(workspaceLabEdgeMarkers)}
            onChange={(marker) => onEdgeStyleChange({ ...edgeStyle, marker })}
            description={
              getWorkspaceLabEdgeMarker(edgeStyle.marker).description
            }
          />
        </div>
      ) : null}

      <SelectField
        label="연결 포인트"
        value={connectionPointStyle}
        options={toSelectOptions(workspaceLabConnectionPointStyles)}
        onChange={(connectionPointStyle) => onChange({ connectionPointStyle })}
        description={currentConnectionPointStyle.description}
      />
    </InspectorSection>
  );
}
