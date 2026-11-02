import type {
  LabDensity,
  LabEdgeState,
  LabNodeState,
  LabTheme,
  LabViewport,
  WorkspaceLabScenario,
} from "../model/types";

type WorkspaceLabInspectorProps = {
  scenarios: WorkspaceLabScenario[];
  scenarioId: WorkspaceLabScenario["id"];
  nodeState: LabNodeState;
  edgeState: LabEdgeState;
  theme: LabTheme;
  density: LabDensity;
  viewport: LabViewport;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showToolbar: boolean;
  showPlayer: boolean;
  onScenarioChange: (value: WorkspaceLabScenario["id"]) => void;
  onNodeStateChange: (value: LabNodeState) => void;
  onEdgeStateChange: (value: LabEdgeState) => void;
  onThemeChange: (value: LabTheme) => void;
  onDensityChange: (value: LabDensity) => void;
  onViewportChange: (value: LabViewport) => void;
  onShowLeftPanelChange: (value: boolean) => void;
  onShowRightPanelChange: (value: boolean) => void;
  onShowToolbarChange: (value: boolean) => void;
  onShowPlayerChange: (value: boolean) => void;
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

export function WorkspaceLabInspector({
  scenarios,
  scenarioId,
  nodeState,
  edgeState,
  theme,
  density,
  viewport,
  showLeftPanel,
  showRightPanel,
  showToolbar,
  showPlayer,
  onScenarioChange,
  onNodeStateChange,
  onEdgeStateChange,
  onThemeChange,
  onDensityChange,
  onViewportChange,
  onShowLeftPanelChange,
  onShowRightPanelChange,
  onShowToolbarChange,
  onShowPlayerChange,
}: WorkspaceLabInspectorProps) {
  const currentScenario = scenarios.find((item) => item.id === scenarioId);

  return (
    <aside className="workspace-lab-inspector flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-5 py-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-indigo-600 uppercase">
          Inspector
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          Workspace UI
        </h2>
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
          <p className="text-xs leading-5 text-slate-500">
            {currentScenario?.description}
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
            options={[
              { value: "neutral", label: "Neutral" },
              { value: "soft", label: "Soft" },
              { value: "contrast", label: "High contrast" },
            ]}
            onChange={onThemeChange}
          />
          <SelectField
            label="밀도"
            value={density}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
            onChange={onDensityChange}
          />
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

        <section className="space-y-2 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Regions
          </h3>
          <Toggle
            label="왼쪽 패널"
            checked={showLeftPanel}
            onChange={onShowLeftPanelChange}
          />
          <Toggle
            label="메모 패널"
            checked={showRightPanel}
            onChange={onShowRightPanelChange}
          />
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
      </div>
    </aside>
  );
}
