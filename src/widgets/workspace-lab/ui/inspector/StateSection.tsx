import type { LabEdgeState, LabNodeState } from "../../model/types";
import { InspectorSection, SelectField } from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

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

export function StateSection({ config, onChange }: InspectorSectionProps) {
  return (
    <InspectorSection title="상태">
      <SelectField
        label="포커스 노드"
        value={config.nodeState}
        options={nodeStates}
        onChange={(nodeState) => onChange({ nodeState })}
      />
      <SelectField
        label="포커스 연결선"
        value={config.edgeState}
        options={edgeStates}
        onChange={(edgeState) => onChange({ edgeState })}
      />
    </InspectorSection>
  );
}
