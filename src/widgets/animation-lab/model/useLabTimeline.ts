import { useState } from "react";
import { type LectureAnimationAction } from "@/src/entities/lecture";
import {
  createDefaultLabAction,
  createLabStep,
  getLabActionNodeIds,
  getLabActionWithNodeIds,
  type LabActionType,
  type LabStep,
} from "./labTimeline";

/*
함수 이름 : useLabTimeline
기능 : 편집 중인 타임라인 단계와 지금 고친 단계를 관리한다.
인자 : () => LabStep[] createInitialSteps -> 처음 보여줄 단계를 만드는 함수
반환값 : 단계 목록, 활성 단계 ID, 단계를 고치는 함수들
*/
export const useLabTimeline = (createInitialSteps: () => LabStep[]) => {
  const [steps, setSteps] = useState(createInitialSteps);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const addStep = (type: LabActionType) => {
    const step = createLabStep(createDefaultLabAction(type));

    setSteps((current) => [...current, step]);
    setActiveStepId(step.id);
  };

  const removeStep = (stepId: string) => {
    setSteps((current) => current.filter((step) => step.id !== stepId));
    setActiveStepId((current) => (current === stepId ? null : current));
  };

  const moveStep = (stepId: string, offset: -1 | 1) => {
    setSteps((current) => {
      const index = current.findIndex((step) => step.id === stepId);
      const nextIndex = index + offset;

      if (index === -1 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const updateStep = (stepId: string, patch: Partial<LabStep>) => {
    setSteps((current) =>
      current.map((step) =>
        step.id === stepId ? { ...step, ...patch } : step,
      ),
    );
  };

  const updateStepAction = (stepId: string, action: LectureAnimationAction) =>
    updateStep(stepId, { action });

  /*
  연결선 추적은 고른 순서가 경로가 되므로 뒤에 덧붙인다. 다시 고르면 목록에서 뺀다.
  */
  const toggleActiveStepNode = (nodeId: string) => {
    setSteps((current) =>
      current.map((step) => {
        const nodeIds = getLabActionNodeIds(step.action);

        if (step.id !== activeStepId || nodeIds === null) return step;

        return {
          ...step,
          action: getLabActionWithNodeIds(
            step.action,
            nodeIds.includes(nodeId)
              ? nodeIds.filter((id) => id !== nodeId)
              : [...nodeIds, nodeId],
          ),
        };
      }),
    );
  };

  const replaceSteps = (nextSteps: LabStep[]) => {
    setSteps(nextSteps);
    setActiveStepId(null);
  };

  return {
    steps,
    activeStepId,
    setActiveStepId,
    addStep,
    removeStep,
    moveStep,
    updateStep,
    updateStepAction,
    toggleActiveStepNode,
    replaceSteps,
  };
};
