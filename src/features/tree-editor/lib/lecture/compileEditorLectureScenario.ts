import {
  compileLectureScenario,
  createLectureCompileLogEvent,
  createLectureCompilerTree,
  logLectureEvent,
  type LectureCompileIssue,
  type LectureCompilerTree,
  type LectureCompileSourceMap,
} from "@/src/entities/lecture";
import {
  type CustomEditorEdge,
  type CustomEditorNode,
  type EditorLectureScript,
} from "../../model/types";
import { getEditorLectureScript } from "./getEditorLectureScript";
import { getEditorLectureTreeNodes } from "./getEditorLectureTreeNodes";

/*
함수 이름 : createEditorLectureCompilerTree
기능 : editor store의 노드와 엣지로 컴파일러가 읽는 트리를 만든다. 노드 기준은 getEditorLectureTreeNodes를 따른다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록. source가 부모, target이 자식이다
반환값 : 서버 노드 ID로 읽는 트리 조회 함수
*/
export const createEditorLectureCompilerTree = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): LectureCompilerTree =>
  createLectureCompilerTree(getEditorLectureTreeNodes(nodes, edges));

type CompileEditorLectureScenarioOptions = {
  scriptId: string; // 만들 대본의 ID
  nodes: CustomEditorNode[]; // 현재 editor store의 노드 목록
  edges: CustomEditorEdge[]; // 현재 editor store의 엣지 목록
};

export type EditorLectureCompileResult =
  | {
      success: true;
      script: EditorLectureScript;
      sourceMap: LectureCompileSourceMap;
      warnings: LectureCompileIssue[];
    }
  | { success: false; issues: LectureCompileIssue[] };

/*
함수 이름 : compileEditorLectureScenario
기능 : 시나리오를 지금 편집기 트리로 컴파일하고, 대본의 서버 노드 ID를 편집기 clientId로 옮긴다. 컴파일 결과와 측정값을 운영 로그로 남긴다.
인자 : unknown scenario -> 모델 출력처럼 아직 검사하지 않은 시나리오
CompileEditorLectureScenarioOptions options -> 대본 ID와 editor store의 노드·엣지
반환값 : 편집기에서 실행할 대본과 source map, 또는 시나리오 위치별 문제
*/
export const compileEditorLectureScenario = (
  scenario: unknown,
  { scriptId, nodes, edges }: CompileEditorLectureScenarioOptions,
): EditorLectureCompileResult => {
  const startedAt = performance.now();
  const result = compileLectureScenario(scenario, {
    scriptId,
    tree: createEditorLectureCompilerTree(nodes, edges),
  });

  logLectureEvent(
    createLectureCompileLogEvent({
      scenario,
      scriptId,
      result,
      compileMs: performance.now() - startedAt,
    }),
  );

  if (!result.success) return result;

  const script = getEditorLectureScript(result.script, nodes);

  /*
  컴파일러가 같은 노드 목록으로 모든 노드의 존재를 확인했으므로 clientId를 찾지 못할 수 없다.
  여기서 실패하면 두 함수의 노드 기준이 어긋난 버그다.
  */
  if (script === null) {
    throw new Error(
      "컴파일한 대본의 노드를 편집기에서 찾지 못했습니다. 컴파일러 트리와 편집기 노드의 기준이 다릅니다.",
    );
  }

  return { ...result, script };
};
