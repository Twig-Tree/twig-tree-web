import {
  LAB_SCENARIO_FIXTURES,
  type LabScenarioIssueGroup,
  type LabScenarioRun,
} from "../model/labScenarioRun";

export type LabScenarioDraft = {
  fixtureId: string; // 캔버스와 컴파일에 쓸 트리를 정한 fixture
  scenarioText: string; // 편집 중인 시나리오 JSON
};

type LabScenarioComposerProps = {
  draft: LabScenarioDraft;
  run: LabScenarioRun; // draft를 컴파일한 결과
  onChangeDraft: (draft: LabScenarioDraft) => void;
};

const FIXTURE_GROUPS = [
  { kind: "valid", label: "통과하는 시나리오" },
  { kind: "invalid", label: "거부되는 시나리오" },
] as const;

/*
함수 이름 : createLabScenarioDraft
기능 : fixture의 시나리오를 편집할 수 있게 들여쓴 JSON으로 채운다.
인자 : string fixtureId -> 불러올 fixture ID
반환값 : 시나리오 편집 상태
*/
export const createLabScenarioDraft = (
  fixtureId: string,
): LabScenarioDraft => ({
  fixtureId,
  scenarioText: JSON.stringify(
    LAB_SCENARIO_FIXTURES.find(({ id }) => id === fixtureId)?.scenario ?? {},
    null,
    2,
  ),
});

/*
함수 이름 : LabScenarioIssueList
기능 : 위치별로 묶은 문제를 cue 단위 제목 아래에 나열한다.
인자 : LabScenarioIssueGroup[] groups -> 문제 묶음
반환값 : 문제 목록
*/
function LabScenarioIssueList({ groups }: { groups: LabScenarioIssueGroup[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {groups.map(({ key, label, issues }) => (
        <li
          key={key}
          className="rounded-control border border-line bg-surface p-2"
        >
          <p className="mb-1 text-xs font-bold text-content">{label}</p>
          <ul className="flex flex-col gap-1">
            {issues.map(({ severity, stage, path, message }, index) => (
              <li
                key={index}
                className={`text-xs font-medium ${
                  severity === "error" ? "text-danger" : "text-warning-strong"
                }`}
              >
                <span className="mr-1 font-mono">[{stage}]</span>
                {path ? <code className="mr-1">{path}</code> : null}
                {message}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/*
함수 이름 : LabScenarioComposer
기능 : fixture를 불러와 시나리오 JSON을 고치고, 컴파일 문제를 cue 위치별로 보여 준다.
인자 : LabScenarioComposerProps
반환값 : 시나리오 편집 도구
*/
export function LabScenarioComposer({
  draft,
  run,
  onChangeDraft,
}: LabScenarioComposerProps) {
  return (
    <div className="flex flex-col gap-4">
      <section aria-label="fixture 선택" className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-content-secondary">fixture</h3>
        <select
          aria-label="fixture"
          value={draft.fixtureId}
          className="h-9 rounded-control border border-line bg-surface px-2 text-sm text-content"
          onChange={(event) =>
            onChangeDraft(createLabScenarioDraft(event.target.value))
          }
        >
          {FIXTURE_GROUPS.map(({ kind, label }) => (
            <optgroup key={kind} label={label}>
              {LAB_SCENARIO_FIXTURES.filter(
                (fixture) => fixture.kind === kind,
              ).map(({ id, label: fixtureLabel }) => (
                <option key={id} value={id}>
                  {fixtureLabel}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-content-muted">
          캔버스는 이 fixture가 전제하는 트리로 바뀝니다. 시나리오를 고쳐도
          트리는 그대로입니다.
        </p>
      </section>

      <section aria-label="시나리오" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-content-secondary">
            시나리오 JSON
          </h3>
          <span
            role="status"
            className={`text-xs font-medium ${
              run.success ? "text-content-muted" : "text-danger"
            }`}
          >
            {run.success
              ? `장면 ${run.script.scenes.length}개 · 비트 ${run.script.scenes.reduce(
                  (count, scene) => count + scene.beats.length,
                  0,
                )}개`
              : "컴파일 실패"}
          </span>
        </div>
        <textarea
          aria-label="시나리오 JSON"
          spellCheck={false}
          value={draft.scenarioText}
          rows={16}
          className="w-full resize-y rounded-control border border-line bg-surface p-2 font-mono text-xs text-content"
          onChange={(event) =>
            onChangeDraft({ ...draft, scenarioText: event.target.value })
          }
        />
      </section>

      {run.success ? (
        run.warningGroups.length > 0 ? (
          <section aria-label="경고" className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-content-secondary">경고</h3>
            <LabScenarioIssueList groups={run.warningGroups} />
          </section>
        ) : null
      ) : (
        <section
          aria-label="컴파일 문제"
          role="alert"
          className="flex flex-col gap-2"
        >
          <h3 className="text-xs font-bold text-content-secondary">
            컴파일 문제
          </h3>
          <LabScenarioIssueList groups={run.issueGroups} />
        </section>
      )}
    </div>
  );
}
