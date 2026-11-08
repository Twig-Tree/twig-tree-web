import { useRef, useState } from "react";
import {
  createLectureGenerationLogEvent,
  getLectureGenerationResult,
  getLectureRepairRequest,
  logLectureEvent,
  useGenerateLectureScenarioMutation,
  type LectureCompilerTree,
  type LectureCompileSourceMap,
  type LectureGenerationIssue,
  type LectureGenerationStep,
  type LectureRepairRequest,
  type LectureScenario,
  type LectureScript,
} from "@/src/entities/lecture";
import { createEditorLectureCompilerTree } from "../../lib/lecture/compileEditorLectureScenario";
import { getEditorLectureTreeOutline } from "../../lib/lecture/getEditorLectureTreeNodes";
import {
  validateLectureRequest,
  validateLectureTreeOutline,
} from "../../lib/lecture/validateLectureGeneration";
import { useTreeStore } from "../treeStore";

export type GenerateLectureResult =
  | {
      status: "success";
      script: LectureScript; // 서버 노드 ID로 가리키는 대본. LecturePlayer가 재생할 때 clientId로 바꾼다
      scenario: LectureScenario; // 강의의 원본. 저장할 때 대본 대신 이것을 남긴다
      sourceMap: LectureCompileSourceMap;
      warnings: LectureGenerationIssue[];
    }
  | {
      status: "invalid";
      message: string; // 요청을 보내지 않은 이유. 화면에 그대로 보여 준다
    }
  | {
      status: "failure";
      failedStep: LectureGenerationStep; // 마지막 응답이 멈춘 단계
      issues: LectureGenerationIssue[];
    }
  | {
      status: "request-error";
      error: unknown; // 생성 요청이 던진 오류. 백엔드 오류 코드는 응답 본문의 code에 있다
    };

/*
함수 이름 : useGenerateLecture
기능 : 지금 편집기 트리로 강의 시나리오를 요청하고, 응답을 대본으로 컴파일한다. 고칠 수 있는 문제가 있으면 repair를 정해진 횟수까지 보낸다.
인자 : 없음
반환값 : 강의 생성 핸들러와 생성 중 여부

생성 중 여부는 mutation의 isPending이 아니라 따로 둔다. 첫 요청과 repair 사이에 응답을 처리하는 동안에도 생성 중이기 때문이다.
*/
export const useGenerateLecture = () => {
  const { mutateAsync } = useGenerateLectureScenarioMutation();
  const [isGenerating, setIsGenerating] = useState(false);

  /*
  state는 다음 렌더에야 바뀌므로, 같은 렌더에서 두 번 눌러도 요청이 한 번만 나가도록 ref로 막는다.
  */
  const isGeneratingRef = useRef(false);

  /*
  요청을 보내고 응답을 처리한다. repair가 필요하면 직전 응답과 문제를 실어 다시 보낸다.
  첫 요청과 repair는 같은 트리와 같은 대본 ID를 쓴다. 생성 중에 트리를 고쳐도 모델이 본 outline과 컴파일 기준이 어긋나지 않는다.
  */
  const requestLecture = async (
    treeId: string,
    request: string,
    treeOutline: string,
    tree: LectureCompilerTree,
  ): Promise<GenerateLectureResult> => {
    const scriptId = `generated-${crypto.randomUUID()}`;
    let repair: LectureRepairRequest | null = null;
    let repairCount = 0;

    while (true) {
      let response;

      try {
        response = await mutateAsync({ treeId, request, treeOutline, repair });
      } catch (error) {
        return { status: "request-error", error };
      }

      const startedAt = performance.now();
      const result = getLectureGenerationResult(response.responseText, {
        scriptId,
        tree,
        usage: response.usage,
      });

      logLectureEvent(
        createLectureGenerationLogEvent({
          response,
          scriptId,
          repairAttempt: repair?.attempt ?? 0,
          result,
          processMs: performance.now() - startedAt,
        }),
      );

      if (result.success) {
        return {
          status: "success",
          script: result.script,
          scenario: result.scenario,
          sourceMap: result.sourceMap,
          warnings: result.warnings,
        };
      }

      const nextRepair = getLectureRepairRequest({
        result,
        responseText: response.responseText,
        repairCount,
      });

      if (nextRepair === null) {
        return {
          status: "failure",
          failedStep: result.failedStep,
          issues: result.issues,
        };
      }

      repair = nextRepair;
      repairCount += 1;
    }
  };

  /*
  요청 문장과 지금 트리를 검사한 뒤 강의를 만든다. 생성 중에 다시 부르면 아무것도 하지 않는다.
  */
  const generateLecture = async (
    request: string,
  ): Promise<GenerateLectureResult | null> => {
    if (isGeneratingRef.current) return null;

    const { treeId, nodes, edges } = useTreeStore.getState();
    if (treeId === null) {
      return {
        status: "invalid",
        message: "트리를 불러온 뒤에 다시 시도해 주세요.",
      };
    }

    const requestMessage = validateLectureRequest(request);
    if (requestMessage !== null) {
      return { status: "invalid", message: requestMessage };
    }

    const treeOutline = getEditorLectureTreeOutline(nodes, edges);
    const outlineMessage = validateLectureTreeOutline(treeOutline);
    if (outlineMessage !== null) {
      return { status: "invalid", message: outlineMessage };
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);

    try {
      return await requestLecture(
        treeId,
        request.trim(),
        treeOutline,
        createEditorLectureCompilerTree(nodes, edges),
      );
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  return { generateLecture, isGenerating };
};
