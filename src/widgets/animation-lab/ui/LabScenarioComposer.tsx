import { type LectureAnimation } from "@/src/entities/lecture";
import {
  LAB_SCENARIO_FIXTURES,
  type LabScenarioIssueGroup,
  type LabScenarioRun,
} from "../model/labScenarioRun";
import { LabCopyButton } from "./LabCopyButton";
import { LabScenarioOutline } from "./LabScenarioOutline";

export type LabScenarioDraft = {
  fixtureId: string; // 캔버스와 컴파일에 쓸 트리를 정한 fixture
  scenarioText: string; // 편집 중인 시나리오 JSON
};

type LabScenarioComposerProps = {
  draft: LabScenarioDraft;
  run: LabScenarioRun; // draft를 컴파일한 결과
  onChangeDraft: (draft: LabScenarioDraft) => void;
  onPlayPart: (animation: LectureAnimation) => void; // 비트나 cue 하나만 재생한다
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
기능 : fixture를 불러와 시나리오 JSON을 고치고, 컴파일 문제를 cue 위치별로 보여 준다. 성공하면 컴파일 결과를 펼쳐 보여 준다.
인자 : LabScenarioComposerProps
반환값 : 시나리오 편집 도구
*/
export function LabScenarioComposer({
  draft,
  run,
  onChangeDraft,
  onPlayPart,
}: LabScenarioComposerProps) {
  const fixture = LAB_SCENARIO_FIXTURES.find(
    ({ id }) => id === draft.fixtureId,
  );
  const labelByNodeId = new Map(
    (fixture?.treeNodes ?? []).map((node) => [node.id, node.label]),
  );

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
        {/*
        fixture 트리는 fixtures/trees/<이름>.json과 같은 모양이라, 고친 시나리오와 함께 새 fixture로 옮길 수 있다.
        */}
        <div className="flex flex-wrap gap-1.5">
          <LabCopyButton label="시나리오 복사" text={draft.scenarioText} />
          <LabCopyButton
            label="대본 복사"
            text={run.success ? JSON.stringify(run.script, null, 2) : null}
          />
          <LabCopyButton
            label="fixture 트리 복사"
            text={fixture ? JSON.stringify(fixture.tree, null, 2) : null}
          />
        </div>
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

      {run.success ? (
        <section aria-label="컴파일 결과" className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-content-secondary">
            컴파일 결과
          </h3>
          <LabScenarioOutline
            scenario={run.scenario}
            script={run.script}
            sourceMap={run.sourceMap}
            labelByNodeId={labelByNodeId}
            onPlay={onPlayPart}
          />
        </section>
      ) : null}
    </div>
  );
}
