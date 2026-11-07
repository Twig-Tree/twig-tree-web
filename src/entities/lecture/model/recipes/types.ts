import type * as z from "zod/mini";
import { type LectureMotion, type ResolvedDelivery } from "../lectureMotion";
import { type LectureAnimation } from "../types";

/*
recipe는 atomic 동작을 엮은 연출 단위다. 노드 역할(입력)과 motion 값을 받아 비트 하나의 애니메이션을 만든다.
시간·배율·색은 직접 적지 않고 context.motion에서 읽는다. 그래야 pace·intensity·tone이 달라져도 recipe를 따로 만들지 않는다.

recipe는 시나리오의 cue를 직접 받지 않는다. 어떤 intent를 어떤 recipe로 보낼지는 컴파일러(#139)가 정하고,
랩 프리셋처럼 시나리오가 없는 곳도 같은 recipe를 부를 수 있게 하기 위해서다.
*/

/*
recipe가 트리를 읽는 창구. entity는 트리 데이터를 import하지 않으므로 함수로만 받고, 구현은 부르는 쪽(컴파일러, 랩)이 넣는다.
*/
export type LectureRecipeTree = {
  getChildIds: (nodeId: string) => string[]; // 화면에 보이는 순서의 자식 노드 ID. 없거나 모르는 노드면 빈 목록
  /*
  조상에서 자손까지 연결선을 따라 내려가는 경로(양 끝 포함). 대본의 trace는 부모→자식 순서로 노드를 받으므로 이 순서로 돌려준다.
  ancestorNodeId가 descendantNodeId의 조상이 아니면 null
  */
  getPathNodeIds: (
    ancestorNodeId: string,
    descendantNodeId: string,
  ) => string[] | null;
};

export type LectureRecipeContext = {
  motion: LectureMotion; // delivery를 토큰 표에서 찾은 구체 값
  tree: LectureRecipeTree;
};

/*
recipe를 만들지 못했거나 애니메이션을 함께 실행할 수 없는 이유.
path는 recipe 실패면 입력 안의 위치이고, 조합 검사(getAnimationCompositionIssues)면 애니메이션 안의 위치다.
컴파일러가 각각 cue의 role 위치와 생성 동작의 출처로 옮겨 보고한다.
*/
export type LectureRecipeIssue = {
  path: PropertyKey[];
  message: string;
};

/*
입력 모양은 맞지만 트리와 맞지 않아(경로가 없음, 자식이 없음) 만들 수 없을 때 create가 돌려준다.
*/
export type LectureRecipeFailure = { issues: LectureRecipeIssue[] };

export type LectureRecipeDefinition<Input> = {
  inputSchema: z.ZodMiniType<Input>; // 노드 역할의 모양과 개수. 통과하지 못하면 create를 부르지 않는다
  defaultDelivery: ResolvedDelivery; // 부르는 쪽이 비운 delivery를 채운다. 컴파일러는 intent 기본값으로 모두 채워 넘긴다
  create: (
    input: Input,
    context: LectureRecipeContext,
  ) => LectureAnimation | LectureRecipeFailure;
};

export type LectureRecipeResult =
  | { success: true; animation: LectureAnimation }
  | { success: false; issues: LectureRecipeIssue[] };
