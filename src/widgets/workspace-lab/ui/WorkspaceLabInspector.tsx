import { useState } from "react";
import type {
  LabCanvasStyle,
  LabCollapseControlStyle,
  LabConnectionPointStyle,
  LabDensity,
  LabEdgeState,
  LabEdgeStyle,
  LabLayoutMode,
  LabLayoutSpacing,
  LabNodeShape,
  LabNodeState,
  LabPanelStyle,
  LabTheme,
  LabViewport,
  WorkspaceLabScenario,
} from "../model/types";
import {
  getWorkspaceLabEdgeEffect,
  getWorkspaceLabEdgeLineStyle,
  getMatchingWorkspaceLabEdgeStylePresetId,
  getWorkspaceLabEdgeStylePreset,
  workspaceLabEdgeColors,
  workspaceLabEdgeEffects,
  workspaceLabEdgeLineStyles,
  workspaceLabEdgeOpacities,
  workspaceLabEdgePatterns,
  workspaceLabEdgeStylePresets,
  workspaceLabEdgeThicknesses,
  type WorkspaceLabEdgeStylePresetId,
  type WorkspaceLabEdgeStylePresetSelection,
} from "../model/edge-styles";
import {
  getWorkspaceLabLayout,
  getWorkspaceLabLayoutSpacing,
  workspaceLabLayouts,
  workspaceLabLayoutSpacings,
} from "../model/layouts";
import {
  getWorkspaceLabNodeShape,
  workspaceLabNodeShapes,
} from "../model/node-shapes";
import {
  getWorkspaceLabPanelBorder,
  getWorkspaceLabPanelPlacement,
  getWorkspaceLabPanelSurface,
  workspaceLabPanelBorders,
  workspaceLabPanelDensities,
  workspaceLabPanelPlacements,
  workspaceLabPanelSurfaces,
  workspaceLabPanelWidths,
} from "../model/panels";
import {
  getWorkspaceLabTheme,
  getWorkspaceLabThemePalette,
  workspaceLabThemes,
} from "../model/themes";
import {
  getWorkspaceLabCanvasStyle,
  getWorkspaceLabCollapseControlStyle,
  getWorkspaceLabConnectionPointStyle,
  getWorkspaceLabNodeDensity,
  workspaceLabCanvasStyles,
  workspaceLabCollapseControlStyles,
  workspaceLabConnectionPointStyles,
  workspaceLabNodeDensities,
} from "../model/visual-slots";

type WorkspaceLabInspectorProps = {
  scenarios: WorkspaceLabScenario[];
  scenarioId: WorkspaceLabScenario["id"];
  nodeState: LabNodeState;
  edgeState: LabEdgeState;
  edgeStyle: LabEdgeStyle;
  layoutMode: LabLayoutMode;
  layoutSpacing: LabLayoutSpacing;
  nodeShape: LabNodeShape;
  connectionPointStyle: LabConnectionPointStyle;
  collapseControlStyle: LabCollapseControlStyle;
  canvasStyle: LabCanvasStyle;
  theme: LabTheme;
  density: LabDensity;
  viewport: LabViewport;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showToolbar: boolean;
  showPlayer: boolean;
  leftPanelStyle: LabPanelStyle;
  memoPanelStyle: LabPanelStyle;
  onScenarioChange: (value: WorkspaceLabScenario["id"]) => void;
  onNodeStateChange: (value: LabNodeState) => void;
  onEdgeStateChange: (value: LabEdgeState) => void;
  onEdgeStyleChange: (value: LabEdgeStyle) => void;
  onLayoutModeChange: (value: LabLayoutMode) => void;
  onLayoutSpacingChange: (value: LabLayoutSpacing) => void;
  onNodeShapeChange: (value: LabNodeShape) => void;
  onConnectionPointStyleChange: (value: LabConnectionPointStyle) => void;
  onCollapseControlStyleChange: (value: LabCollapseControlStyle) => void;
  onCanvasStyleChange: (value: LabCanvasStyle) => void;
  onThemeChange: (value: LabTheme) => void;
  onDensityChange: (value: LabDensity) => void;
  onViewportChange: (value: LabViewport) => void;
  onShowLeftPanelChange: (value: boolean) => void;
  onShowRightPanelChange: (value: boolean) => void;
  onShowToolbarChange: (value: boolean) => void;
  onShowPlayerChange: (value: boolean) => void;
  onLeftPanelStyleChange: (value: LabPanelStyle) => void;
  onMemoPanelStyleChange: (value: LabPanelStyle) => void;
};

const nodeStates: Array<{ value: LabNodeState; label: string }> = [
  { value: "default", label: "기본" },
  { value: "selected", label: "선택" },
  { value: "highlighted", label: "검색 강조" },
  { value: "lecture", label: "강의 강조" },
  { value: "editing", label: "편집 중" },
  { value: "loading", label: "저장 중" },
  { value: "error", label: "오류" },
  { value: "collapsed", label: "접힘" },
];

const edgeStates: Array<{ value: LabEdgeState; label: string }> = [
  { value: "default", label: "기본" },
  { value: "active", label: "선택" },
  { value: "traced", label: "강의 추적" },
];

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-slate-700">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-indigo-600"
      />
    </label>
  );
}

type PanelStyleSectionProps = {
  title: string; // Inspector 구획 제목
  visibleLabel: string; // 패널 표시 토글 이름
  isVisible: boolean; // 미리보기에 패널을 그리는지 여부
  panelStyle: LabPanelStyle; // 패널의 현재 디자인 선택값
  onVisibleChange: (value: boolean) => void;
  onPanelStyleChange: (value: LabPanelStyle) => void;
};

function PanelStyleSection({
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
    <section className="space-y-3 border-t border-slate-100 pt-5">
      <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {title}
      </h3>
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
            options={workspaceLabPanelPlacements.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={(placement) =>
              onPanelStyleChange({ ...panelStyle, placement })
            }
          />
          <p className="text-[11px] leading-4 text-slate-500">
            {currentPlacement.description}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="너비"
              value={panelStyle.width}
              options={workspaceLabPanelWidths.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(width) => onPanelStyleChange({ ...panelStyle, width })}
            />
            <SelectField
              label="밀도"
              value={panelStyle.density}
              options={workspaceLabPanelDensities.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(density) =>
                onPanelStyleChange({ ...panelStyle, density })
              }
            />
            <SelectField
              label="표면"
              value={panelStyle.surface}
              options={workspaceLabPanelSurfaces.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(surface) =>
                onPanelStyleChange({ ...panelStyle, surface })
              }
            />
            <SelectField
              label="경계"
              value={panelStyle.border}
              options={workspaceLabPanelBorders.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(border) =>
                onPanelStyleChange({ ...panelStyle, border })
              }
            />
          </div>
          <p className="text-[11px] leading-4 text-slate-500">
            {currentSurface.description} {currentBorder.description}
          </p>
        </>
      ) : null}
    </section>
  );
}

export function WorkspaceLabInspector({
  scenarios,
  scenarioId,
  nodeState,
  edgeState,
  edgeStyle,
  layoutMode,
  layoutSpacing,
  nodeShape,
  connectionPointStyle,
  collapseControlStyle,
  canvasStyle,
  theme,
  density,
  viewport,
  showLeftPanel,
  showRightPanel,
  showToolbar,
  showPlayer,
  leftPanelStyle,
  memoPanelStyle,
  onScenarioChange,
  onNodeStateChange,
  onEdgeStateChange,
  onEdgeStyleChange,
  onLayoutModeChange,
  onLayoutSpacingChange,
  onNodeShapeChange,
  onConnectionPointStyleChange,
  onCollapseControlStyleChange,
  onCanvasStyleChange,
  onThemeChange,
  onDensityChange,
  onViewportChange,
  onShowLeftPanelChange,
  onShowRightPanelChange,
  onShowToolbarChange,
  onShowPlayerChange,
  onLeftPanelStyleChange,
  onMemoPanelStyleChange,
}: WorkspaceLabInspectorProps) {
  const [showCustomEdgeStyle, setShowCustomEdgeStyle] = useState(false);
  const currentScenario = scenarios.find((item) => item.id === scenarioId);
  const currentTheme = getWorkspaceLabTheme(theme);
  const currentLayout = getWorkspaceLabLayout(layoutMode);
  const currentLayoutSpacing = getWorkspaceLabLayoutSpacing(layoutSpacing);
  const currentNodeShape = getWorkspaceLabNodeShape(nodeShape);
  const currentNodeDensity = getWorkspaceLabNodeDensity(density);
  const currentCanvasStyle = getWorkspaceLabCanvasStyle(canvasStyle);
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
  const currentCollapseControlStyle =
    getWorkspaceLabCollapseControlStyle(collapseControlStyle);
  const themePalette = getWorkspaceLabThemePalette(currentTheme);

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
        <section className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Scenario
          </h3>
          <SelectField
            label="트리 구성"
            value={scenarioId}
            options={scenarios.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
            onChange={onScenarioChange}
          />
          <SelectField
            label="트리 전개"
            value={layoutMode}
            options={workspaceLabLayouts.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onLayoutModeChange}
          />
          <SelectField
            label="배치 간격"
            value={layoutSpacing}
            options={workspaceLabLayoutSpacings.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onLayoutSpacingChange}
          />
          <p className="text-xs leading-5 text-slate-500">
            {currentScenario?.description}
          </p>
          <p className="text-xs leading-5 text-slate-500">
            {currentLayout.description}
          </p>
          <p className="text-xs leading-5 text-slate-500">
            {currentLayoutSpacing.description}
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            State
          </h3>
          <SelectField
            label="포커스 노드"
            value={nodeState}
            options={nodeStates}
            onChange={onNodeStateChange}
          />
          <SelectField
            label="포커스 연결선"
            value={edgeState}
            options={edgeStates}
            onChange={onEdgeStateChange}
          />
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Appearance
          </h3>
          <SelectField
            label="테마"
            value={theme}
            options={workspaceLabThemes.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onThemeChange}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              {themePalette.map((swatch) => (
                <span
                  key={swatch.label}
                  className="size-6 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: swatch.color }}
                  title={`${swatch.label} ${swatch.color}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-500">
              {currentTheme.description}
            </p>
          </div>
          <SelectField
            label="캔버스"
            value={canvasStyle}
            options={workspaceLabCanvasStyles.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onCanvasStyleChange}
          />
          <p className="text-[11px] leading-4 text-slate-500">
            {currentCanvasStyle.description}
          </p>
          <SelectField
            label="뷰포트"
            value={viewport}
            options={[
              { value: "desktop", label: "Desktop" },
              { value: "compact", label: "Compact" },
            ]}
            onChange={onViewportChange}
          />
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Node
          </h3>
          <SelectField
            label="노드 모양"
            value={nodeShape}
            options={workspaceLabNodeShapes.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onNodeShapeChange}
          />
          <p className="text-[11px] leading-4 text-slate-500">
            {currentNodeShape.description}
          </p>
          <SelectField
            label="노드 밀도"
            value={density}
            options={workspaceLabNodeDensities.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onDensityChange}
          />
          <p className="text-[11px] leading-4 text-slate-500">
            {currentNodeDensity.description}
          </p>
          <SelectField
            label="접기 버튼"
            value={collapseControlStyle}
            options={workspaceLabCollapseControlStyles.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onCollapseControlStyleChange}
          />
          <p className="text-[11px] leading-4 text-slate-500">
            {currentCollapseControlStyle.description}
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Connection
          </h3>
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
          />
          <p className="text-[11px] leading-4 text-slate-500">
            {currentEdgePreset?.description ??
              "세부 속성을 직접 조합한 커스텀 스타일입니다."}
          </p>

          <button
            type="button"
            aria-expanded={showCustomEdgeStyle}
            aria-controls="workspace-lab-edge-custom-controls"
            onClick={() => setShowCustomEdgeStyle((current) => !current)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
          >
            <span>커스텀 설정</span>
            <span aria-hidden="true" className="text-slate-400">
              {showCustomEdgeStyle ? "접기 −" : "열기 +"}
            </span>
          </button>

          {showCustomEdgeStyle ? (
            <div
              id="workspace-lab-edge-custom-controls"
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <SelectField
                label="선 형태"
                value={edgeStyle.lineStyle}
                options={workspaceLabEdgeLineStyles.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                onChange={(lineStyle) =>
                  onEdgeStyleChange({ ...edgeStyle, lineStyle })
                }
              />
              <p className="text-[11px] leading-4 text-slate-500">
                {currentEdgeLineStyle.description}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="패턴"
                  value={edgeStyle.pattern}
                  options={workspaceLabEdgePatterns.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onChange={(pattern) =>
                    onEdgeStyleChange({ ...edgeStyle, pattern })
                  }
                />
                <SelectField
                  label="두께"
                  value={edgeStyle.thickness}
                  options={workspaceLabEdgeThicknesses.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onChange={(thickness) =>
                    onEdgeStyleChange({ ...edgeStyle, thickness })
                  }
                />
                <SelectField
                  label="색상"
                  value={edgeStyle.color}
                  options={workspaceLabEdgeColors.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onChange={(color) =>
                    onEdgeStyleChange({ ...edgeStyle, color })
                  }
                />
                <SelectField
                  label="투명도"
                  value={edgeStyle.opacity}
                  options={workspaceLabEdgeOpacities.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onChange={(opacity) =>
                    onEdgeStyleChange({ ...edgeStyle, opacity })
                  }
                />
              </div>
              <SelectField
                label="특수 효과"
                value={edgeStyle.effect}
                options={workspaceLabEdgeEffects.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                onChange={(effect) =>
                  onEdgeStyleChange({ ...edgeStyle, effect })
                }
              />
              <p className="text-[11px] leading-4 text-slate-500">
                {currentEdgeEffect.description}
              </p>
            </div>
          ) : null}

          <SelectField
            label="연결 포인트"
            value={connectionPointStyle}
            options={workspaceLabConnectionPointStyles.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={onConnectionPointStyleChange}
          />
          <p className="text-[11px] leading-4 text-slate-500">
            {currentConnectionPointStyle.description}
          </p>
        </section>

        <section className="space-y-2 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Regions
          </h3>
          <Toggle
            label="플로팅 툴바"
            checked={showToolbar}
            onChange={onShowToolbarChange}
          />
          <Toggle
            label="하단 플레이어"
            checked={showPlayer}
            onChange={onShowPlayerChange}
          />
        </section>

        <PanelStyleSection
          title="Left panel"
          visibleLabel="왼쪽 패널 표시"
          isVisible={showLeftPanel}
          panelStyle={leftPanelStyle}
          onVisibleChange={onShowLeftPanelChange}
          onPanelStyleChange={onLeftPanelStyleChange}
        />

        <PanelStyleSection
          title="Memo panel"
          visibleLabel="메모 패널 표시"
          isVisible={showRightPanel}
          panelStyle={memoPanelStyle}
          onVisibleChange={onShowRightPanelChange}
          onPanelStyleChange={onMemoPanelStyleChange}
        />
      </div>
    </aside>
  );
}
