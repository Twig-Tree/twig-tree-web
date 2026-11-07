import { ArrowDown, ArrowUp, Play, Square, Undo2, X } from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { IconButton } from "@/src/shared/ui/icon-button";
import { type LectureAnimationAction } from "@/src/entities/lecture";
import { ANIMATION_LAB_TREE } from "../model/fixtureTree";
import {
  getLabActionNodeIds,
  getLabAnimation,
  type LabActionType,
  type LabStep,
} from "../model/labTimeline";
import { LAB_PRESETS } from "../model/presets";
import { type useLabTimeline } from "../model/useLabTimeline";
import { validateLabAction } from "../model/validateLabStep";
import { LabJsonEditor } from "./LabJsonEditor";
import { LabStepEditor } from "./LabStepEditor";

type AnimationComposerProps = {
  timeline: ReturnType<typeof useLabTimeline>; // 편집 중인 타임라인
  isPlaying: boolean; // 재생 중인지 여부
  stage: string | null; // 지금 실행 중인 동작 이름
  isLooping: boolean; // 반복 재생 여부
  onChangeLooping: (isLooping: boolean) => void; // 반복 재생을 켜고 끈다
  onPlay: () => void; // 타임라인을 재생한다
  onStop: () => void; // 재생을 멈추고 시각 효과를 지운다
  onReset: () => void; // 재생을 멈추고 카메라까지 되돌린다
};

const ACTION_BUTTONS: { type: LabActionType; label: string }[] = [
  { type: "focus", label: "Focus" },
  { type: "highlight", label: "Highlight" },
  { type: "dim", label: "Dim" },
  { type: "trace", label: "Trace" },
  { type: "collapse", label: "Collapse" },
  { type: "expand", label: "Expand" },
  { type: "reset", label: "Reset" },
];

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

  const labels = (getLabActionNodeIds(action) ?? []).map(
    (nodeId) => labelByNodeId.get(nodeId) ?? nodeId,
  );
  const separator = action.type === "trace" ? " → " : ", ";

  return `${labels.join(separator) || "대상 없음"} · ${action.durationMs}ms`;
};

/*
함수 이름 : AnimationComposer
기능 : 프리셋과 단계 추가로 타임라인을 만들고, 값을 고쳐 바로 재생하게 한다.
인자 : AnimationComposerProps
반환값 : 애니메이션 조합 도구
*/
export function AnimationComposer({
  timeline,
  isPlaying,
  stage,
  isLooping,
  onChangeLooping,
  onPlay,
  onStop,
  onReset,
}: AnimationComposerProps) {
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

  /*
  빈 대상으로 재생하면 실패한 것처럼 보이므로 막는다. 연결선 경고는 일부라도 보이지만, 끊긴 경로는 고쳐야 할 입력이라 함께 막는다.
  */
  const isPlayDisabled =
    steps.length === 0 ||
    steps.some(
      (step: LabStep) =>
        validateLabAction(step.action, ANIMATION_LAB_TREE) !== null,
    );

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="재생" className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            disabled={isPlayDisabled}
            onClick={onPlay}
          >
            <Play className="size-4" aria-hidden="true" />
            {isPlaying ? "처음부터" : "재생"}
          </Button>
          <Button className="flex-1" disabled={!isPlaying} onClick={onStop}>
            <Square className="size-3.5" aria-hidden="true" />
            중단
          </Button>
          <Button className="flex-1" onClick={onReset}>
            <Undo2 className="size-3.5" aria-hidden="true" />
            초기화
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-medium text-content-secondary">
            <input
              type="checkbox"
              checked={isLooping}
              onChange={(event) => onChangeLooping(event.target.checked)}
            />
            반복 재생
          </label>
          <p
            role="status"
            aria-live="polite"
            className="text-xs font-medium text-accent"
          >
            {isPlaying ? `실행 중: ${stage ?? "준비"}` : "대기 중"}
          </p>
        </div>
      </section>

      <section aria-label="프리셋">
        <h3 className="text-xs font-bold text-content-secondary">프리셋</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LAB_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              className="!h-8 !px-3 text-xs"
              onClick={() => replaceSteps(preset.createSteps())}
            >
              {preset.label}
            </Button>
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
