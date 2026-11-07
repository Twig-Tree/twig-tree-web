import { type LectureRecipeId } from "../recipes/registry";
import { type LectureRecipeTree } from "../recipes/types";
import { type SemanticIntent } from "../scenario/types";
import { type LectureScript } from "../types";

/*
컴파일러는 시나리오를 플레이어가 재생하는 LectureScript로 바꾼다.
같은 시나리오, 같은 트리, 같은 recipe registry 버전이면 항상 같은 대본을 만든다.
그래서 사용자가 접어 둔 상태처럼 화면에만 있는 값은 입력에 넣지 않는다.
*/

/*
컴파일러가 트리를 읽는 창구. recipe가 읽는 함수에 노드 존재 확인을 더한다.
entity는 트리 데이터를 import하지 않으므로 구현은 부르는 쪽(편집기, 랩)이 넣는다.
*/
export type LectureCompilerTree = LectureRecipeTree & {
  hasNode: (nodeId: string) => boolean; // 서버 노드 ID가 지금 트리에 있는지
};

/*
error는 대본을 만들 수 없는 문제이고, warning은 대본은 만들되 알려야 하는 문제다(비트가 너무 김 등).
*/
export type LectureCompileIssueSeverity = "error" | "warning";

/*
문제가 생긴 단계. 같은 위치라도 모델 출력이 틀렸는지(schema, node), recipe가 트리와 맞지 않는지(recipe),
여러 cue를 이었을 때 생긴 문제인지(composition, duration)를 나눠 로그와 랩에서 구분한다.
*/
export type LectureCompileIssueStage =
  | "schema"
  | "node"
  | "recipe"
  | "composition"
  | "duration";

export type LectureCompileIssue = {
  severity: LectureCompileIssueSeverity;
  stage: LectureCompileIssueStage;
  path: PropertyKey[]; // 시나리오 안의 위치. 예: ["scenes", 0, "beats", 1, "cues", 0, "roles", "subject"]
  message: string;
};

/*
생성한 동작의 출처. cue가 만든 동작은 cue 순번과 고른 recipe를, 컴파일러가 직접 넣은 동작은 이유를 남긴다.
장면이 끝날 때 남은 persist 효과는 플레이어가 지우므로 컴파일러가 reset을 넣지 않는다(lecture-script-contract.md).
*/
export type LectureCompileSource =
  | {
      type: "cue";
      cueIndex: number; // 비트 안의 cue 순번
      intent: SemanticIntent;
      recipeId: LectureRecipeId;
    }
  | {
      type: "compiler";
      reason: "empty-beat"; // cue가 없는 비트도 대본에는 애니메이션이 있어야 해서 길이 0인 wait을 넣는다
    };

export type LectureSourceMapEntry = {
  animationPath: PropertyKey[]; // 비트 animation 안의 위치. 이 위치 아래의 모든 동작이 같은 출처다
  source: LectureCompileSource;
};

/*
beat ID로 찾는다. 시나리오 전체에서 beat ID가 고유하고, 대본의 beat ID도 같은 값을 쓴다.
*/
export type LectureCompileSourceMap = Record<string, LectureSourceMapEntry[]>;

export type LectureCompileResult =
  | {
      success: true;
      script: LectureScript;
      sourceMap: LectureCompileSourceMap;
      warnings: LectureCompileIssue[];
    }
  | {
      success: false;
      issues: LectureCompileIssue[]; // error가 하나 이상 있고, 함께 발견한 warning도 담는다
    };
