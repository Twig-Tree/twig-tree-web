import {
  getLectureActionNodeIds,
  type LectureAnimation,
  type ScenarioDelivery,
} from "@/src/entities/lecture";
import { Button } from "@/src/shared/ui/button";
import { ANIMATION_LAB_TREE } from "../model/fixtureTree";
import {
  LAB_DELIVERY_OPTIONS,
  LAB_RECIPE_IDS,
  LAB_RECIPE_REGISTRY_VERSION,
  LAB_RECIPE_SAMPLE_INPUTS,
  type LabRecipeId,
  type LabRecipeRun,
} from "../model/labRecipeRun";

export type LabRecipeDraft = {
  recipeId: LabRecipeId;
  inputText: string; // 편집 중인 recipe 입력 JSON
  delivery: ScenarioDelivery; // 비운 값은 recipe 기본값을 쓴다
};

type LabRecipeComposerProps = {
  draft: LabRecipeDraft;
  run: LabRecipeRun; // draft를 실행한 결과
  onChangeDraft: (draft: LabRecipeDraft) => void;
  onMoveToTimeline: (animation: LectureAnimation) => void; // 결과를 Atomic 타임라인으로 옮겨 고친다
};

const DELIVERY_FIELDS = [
  ["pace", "빠르기"],
  ["intensity", "세기"],
  ["tone", "분위기"],
  ["continuity", "지속"],
] as const satisfies [keyof ScenarioDelivery, string][];

const labelByNodeId = new Map(
  ANIMATION_LAB_TREE.map((node) => [node.id, node.label]),
);

/*
함수 이름 : getAnimationLines
기능 : 애니메이션을 들여쓴 한 줄 요약 목록으로 펼친다. recipe가 어떤 단위 동작을 만들었는지 한눈에 보기 위해서다.
인자 : LectureAnimation animation -> 펼칠 애니메이션
number depth -> 들여쓰기 깊이
반환값 : 깊이와 문구 목록
*/
const getAnimationLines = (
  animation: LectureAnimation,
  depth = 0,
): { depth: number; text: string }[] => {
  if (animation.type === "group") {
    return [
      { depth, text: animation.mode === "sequence" ? "순차" : "병렬" },
      ...animation.children.flatMap((child) =>
        getAnimationLines(child, depth + 1),
      ),
    ];
  }

  const labels = (getLectureActionNodeIds(animation) ?? []).map(
    (nodeId) => labelByNodeId.get(nodeId) ?? nodeId,
  );
  const details = [
    labels.join(animation.type === "trace" ? " → " : ", "),
    "durationMs" in animation ? `${animation.durationMs}ms` : null,
    "persist" in animation && animation.persist ? "유지" : null,
  ].filter(Boolean);

  return [{ depth, text: [animation.type, ...details].join(" · ") }];
};

/*
함수 이름 : LabRecipeComposer
기능 : recipe 하나를 골라 입력과 delivery를 고치고, 만들어진 단위 동작과 실패 이유를 보여 준다.
인자 : LabRecipeComposerProps
반환값 : recipe 실행 도구
*/
export function LabRecipeComposer({
  draft,
  run,
  onChangeDraft,
  onMoveToTimeline,
}: LabRecipeComposerProps) {
  const handleSelectRecipe = (recipeId: LabRecipeId) =>
    onChangeDraft({
      ...draft,
      recipeId,
      inputText: JSON.stringify(LAB_RECIPE_SAMPLE_INPUTS[recipeId], null, 2),
    });

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="recipe 선택" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-content-secondary">recipe</h3>
          <span className="text-xs text-content-muted">
            registry 버전 {LAB_RECIPE_REGISTRY_VERSION}
          </span>
        </div>
        <select
          aria-label="recipe"
          value={draft.recipeId}
          className="h-9 rounded-control border border-line bg-surface px-2 text-sm text-content"
          onChange={(event) =>
            handleSelectRecipe(event.target.value as LabRecipeId)
          }
        >
          {LAB_RECIPE_IDS.map((recipeId) => (
            <option key={recipeId} value={recipeId}>
              {recipeId}
            </option>
          ))}
        </select>
      </section>

      <section aria-label="delivery" className="grid grid-cols-2 gap-2">
        {DELIVERY_FIELDS.map(([field, label]) => (
          <label
            key={field}
            className="flex flex-col gap-1 text-xs font-medium text-content-secondary"
          >
            {label}
            <select
              value={draft.delivery[field] ?? ""}
              className="h-8 rounded-control border border-line bg-surface px-2 text-xs text-content"
              onChange={(event) =>
                onChangeDraft({
                  ...draft,
                  delivery: {
                    ...draft.delivery,
                    [field]: event.target.value || undefined,
                  },
                })
              }
            >
              <option value="">recipe 기본값</option>
              {Object.entries(LAB_DELIVERY_OPTIONS[field]).map(
                ([value, valueLabel]) => (
                  <option key={value} value={value}>
                    {valueLabel} ({value})
                  </option>
                ),
              )}
            </select>
          </label>
        ))}
      </section>

      <section aria-label="recipe 입력" className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-content-secondary">
          입력 (노드 역할)
        </h3>
        <textarea
          aria-label="recipe 입력 JSON"
          spellCheck={false}
          value={draft.inputText}
          rows={5}
          className="w-full resize-y rounded-control border border-line bg-surface p-2 font-mono text-xs text-content"
          onChange={(event) =>
            onChangeDraft({ ...draft, inputText: event.target.value })
          }
        />
        {run.success ? null : (
          <ul role="alert" className="flex flex-col gap-1">
            {run.issues.map(({ path, message }) => (
              <li
                key={`${path}:${message}`}
                className="text-xs font-medium text-danger"
              >
                {path ? <code className="mr-1">{path}</code> : null}
                {message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {run.success ? (
        <section aria-label="만들어진 동작" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-content-secondary">
              만들어진 동작
            </h3>
            <Button
              className="!h-8 !px-3 text-xs"
              onClick={() => onMoveToTimeline(run.animation)}
            >
              타임라인에서 고치기
            </Button>
          </div>
          <ol className="rounded-control border border-line bg-surface p-2 font-mono text-xs text-content">
            {getAnimationLines(run.animation).map(({ depth, text }, index) => (
              <li key={index} style={{ paddingLeft: `${depth * 12}px` }}>
                {text}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
