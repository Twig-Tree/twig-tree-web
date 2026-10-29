import type { TreeNode } from "@/src/entities/tree/model/types";

export type PrototypeRelationKind =
  | "belongs-to"
  | "associated-with"
  | "precedes"
  | "capital-of"
  | "uses-currency"
  | "causes"
  | "requires";

export type PrototypeFlashcardKind =
  | "recall"
  | "relation"
  | "sequence"
  | "collection";

export interface PrototypeTree {
  id: string;
  title: string;
  description: string;
  nodes: TreeNode[];
}

/*
트리의 parentId는 화면 계층만 표현한다. 플래시카드가 "왜 연결되는가"를 물을 수 있도록
프로토타입에서 검증할 의미 관계를 별도 데이터로 둔다.
*/
export interface PrototypeTreeRelation {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  kind: PrototypeRelationKind;
  label: string;
}

export interface PrototypeFlashcard {
  id: string;
  kind: PrototypeFlashcardKind;
  front: string;
  back: string;
  sourceNodeIds: string[];
  sourceRelationIds: string[];
}

export interface PrototypeFlashcardScenario {
  id: string;
  title: string;
  learningGoal: string;
  tree: PrototypeTree;
  relations: PrototypeTreeRelation[];
  cards: PrototypeFlashcard[];
}
