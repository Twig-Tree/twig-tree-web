import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { IconButton } from "@/src/shared/ui/icon-button";
import {
  type LectureAnimationAction,
  getLectureActionNodeIds,
  LECTURE_EFFECT_TYPES,
} from "@/src/entities/lecture";
import { ANIMATION_LAB_TREE } from "../model/fixtureTree";
import { LAB_ACTIONS } from "../model/labActions";
import { getLabAnimation } from "../model/labTimeline";
import {
  LAB_PRESET_CATEGORIES,
  createLabPresetSteps,
  LAB_PRESETS,
  type LabPresetCategory,
} from "../model/presets";
import { type useLabTimeline } from "../model/useLabTimeline";
import { LabJsonEditor } from "./LabJsonEditor";
import { LabStepEditor } from "./LabStepEditor";

type AnimationComposerProps = {
  timeline: ReturnType<typeof useLabTimeline>; // 편집 중인 타임라인
};

const ACTION_BUTTONS = LECTURE_EFFECT_TYPES.map((type) => ({
  type,
  label: LAB_ACTIONS[type].label,
}));

const labelByNodeId = new Map(
  ANIMATION_LAB_TREE.map((node) => [node.id, node.label]),
);

/*
함수 이름 : getLabActionSummary
기능 : 타임라인 목록에 보여줄 동작 요약을 만든다.
인자 : LectureAnimationAction action -> 단위 동작
반환값 : 대상과 시간을 담은 짧은 문구
*/
const getLabActionSummary = (action: LectureAnimationAction): string => {
  if (action.type === "reset") return action.scope;
  if (action.type === "wait") return `${action.durationMs}ms`;

  const labels = (getLectureActionNodeIds(action) ?? []).map(
    (nodeId) => labelByNodeId.get(nodeId) ?? nodeId,
  );
  const separator = action.type === "trace" ? " → " : ", ";

  return `${labels.join(separator) || "대상 없음"} · ${action.durationMs}ms`;
};

/*
함수 이름 : AnimationComposer
기능 : 프리셋과 단계 추가로 타임라인을 만들고 단계마다 값을 고친다. 재생은 화면이 모드와 함께 다룬다.
인자 : AnimationComposerProps
반환값 : 애니메이션 조합 도구
*/
export function AnimationComposer({ timeline }: AnimationComposerProps) {
  const [presetCategory, setPresetCategory] = useState<
    "전체" | LabPresetCategory
  >("전체");
  const {
    steps,
    activeStepId,
    setActiveStepId,
    addStep,
    removeStep,
    moveStep,
    updateStep,
    updateStepAction,
    replaceSteps,
  } = timeline;

  const activeStep = steps.find((step) => step.id === activeStepId);
  const visiblePresets =
    presetCategory === "전체"
      ? LAB_PRESETS
      : LAB_PRESETS.filter((preset) => preset.category === presetCategory);

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="프리셋">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-content-secondary">프리셋</h3>
          <span className="text-xs text-content-muted">
            {visiblePresets.length}개
          </span>
        </div>
        <div
          className="mt-2 flex flex-wrap gap-1.5"
          role="group"
          aria-label="프리셋 분류"
        >
          {(["전체", ...LAB_PRESET_CATEGORIES] as const).map((category) => (
            <Button
              key={category}
              variant={presetCategory === category ? "primary" : undefined}
              className="!h-7 !px-2.5 text-xs"
              aria-pressed={presetCategory === category}
              onClick={() => setPresetCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {visiblePresets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className="rounded-control border border-line bg-surface p-2 text-left transition-colors hover:border-accent"
              onClick={() => replaceSteps(createLabPresetSteps(preset))}
            >
              <span className="block text-xs font-semibold text-content">
                {preset.label}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-content-muted">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="타임라인">
        <h3 className="text-xs font-bold text-content-secondary">타임라인</h3>

        <ol className="mt-2 flex flex-col gap-1.5">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`rounded-control border bg-surface p-2 ${step.id === activeStepId ? "border-accent" : "border-line"}`}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={step.id === activeStepId}
                  className="min-w-0 flex-1 text-left"
                  onClick={() =>
                    setActiveStepId(step.id === activeStepId ? null : step.id)
                  }
                >
                  <span className="block text-sm font-semibold text-content">
                    {index + 1}. {step.action.type}
                  </span>
                  <span className="block truncate text-xs text-content-muted">
                    {getLabActionSummary(step.action)}
                  </span>
                </button>
                <IconButton
                  size="sm"
                  aria-label={`${index + 1}번 단계 위로`}
                  disabled={index === 0}
                  onClick={() => moveStep(step.id, -1)}
                >
                  <ArrowUp />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={`${index + 1}번 단계 아래로`}
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(step.id, 1)}
                >
                  <ArrowDown />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={`${index + 1}번 단계 삭제`}
                  onClick={() => removeStep(step.id)}
                >
                  <X />
                </IconButton>
              </div>

              {index > 0 ? (
                <label className="mt-1 flex items-center gap-2 text-xs font-medium text-content-secondary">
                  <input
                    type="checkbox"
                    checked={step.withPrevious}
                    onChange={(event) =>
                      updateStep(step.id, {
                        withPrevious: event.target.checked,
                      })
                    }
                  />
                  앞 단계와 동시에 시작
                </label>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {ACTION_BUTTONS.map(({ type, label }) => (
            <Button
              key={type}
              className="!h-8 !px-2.5 text-xs"
              onClick={() => addStep(type)}
            >
              + {label}
            </Button>
          ))}
        </div>
      </section>

      {activeStep ? (
        <LabStepEditor
          key={activeStep.id}
          step={activeStep}
          onChangeAction={(action) => updateStepAction(activeStep.id, action)}
        />
      ) : null}

      {steps.length > 0 ? (
        <LabJsonEditor
          animation={getLabAnimation(steps)}
          onApply={replaceSteps}
        />
      ) : null}
    </div>
  );
}
