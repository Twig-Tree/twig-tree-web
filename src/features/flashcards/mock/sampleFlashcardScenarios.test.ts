import { describe, expect, it } from "vitest";
import { sampleFlashcardScenarios } from "./sampleFlashcardScenarios";

describe("sampleFlashcardScenarios", () => {
  it("시나리오 ID가 서로 다르다", () => {
    const scenarioIds = sampleFlashcardScenarios.map((scenario) => scenario.id);

    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
  });

  it.each(sampleFlashcardScenarios)(
    "$title 트리는 루트가 하나이고 모든 부모를 같은 트리에서 찾을 수 있다",
    ({ tree }) => {
      const nodeIds = new Set(tree.nodes.map((node) => node.id));
      const rootNodes = tree.nodes.filter((node) => node.parentId === null);

      expect(nodeIds.size).toBe(tree.nodes.length);
      expect(rootNodes).toHaveLength(1);

      tree.nodes.forEach((node) => {
        if (node.parentId !== null) {
          expect(nodeIds.has(node.parentId)).toBe(true);
        }
      });
    },
  );

  it.each(sampleFlashcardScenarios)(
    "$title 관계는 모두 원본 트리의 노드를 참조한다",
    ({ tree, relations }) => {
      const nodeIds = new Set(tree.nodes.map((node) => node.id));
      const relationIds = relations.map((relation) => relation.id);

      expect(new Set(relationIds).size).toBe(relationIds.length);

      relations.forEach((relation) => {
        expect(nodeIds.has(relation.sourceNodeId)).toBe(true);
        expect(nodeIds.has(relation.targetNodeId)).toBe(true);
      });
    },
  );

  it.each(sampleFlashcardScenarios)(
    "$title 카드는 모두 원본 노드와 관계를 참조한다",
    ({ tree, relations, cards }) => {
      const nodeIds = new Set(tree.nodes.map((node) => node.id));
      const relationIds = new Set(relations.map((relation) => relation.id));
      const cardIds = cards.map((card) => card.id);

      expect(new Set(cardIds).size).toBe(cardIds.length);
      expect(cards.some((card) => card.kind === "recall")).toBe(true);
      expect(cards.some((card) => card.kind === "relation")).toBe(true);

      cards.forEach((card) => {
        expect(card.front.trim()).not.toBe("");
        expect(card.back.trim()).not.toBe("");
        expect(card.sourceNodeIds.length).toBeGreaterThan(0);
        card.sourceNodeIds.forEach((nodeId) => {
          expect(nodeIds.has(nodeId)).toBe(true);
        });
        card.sourceRelationIds.forEach((relationId) => {
          expect(relationIds.has(relationId)).toBe(true);
        });
      });
    },
  );

  it("재생 에너지 원본 트리는 backend seed와 같은 ID와 이름을 사용한다", () => {
    const renewableEnergy = sampleFlashcardScenarios.find(
      (scenario) => scenario.id === "renewable-energy",
    );

    expect(
      renewableEnergy?.tree.nodes.map(({ id, label }) => [id, label]),
    ).toEqual([
      ["1", "에너지 전환"],
      ["2", "기후 목표"],
      ["3", "태양광 발전"],
      ["4", "풍력 발전"],
      ["5", "발전 변동성"],
      ["6", "수요와 공급 균형"],
      ["7", "배터리 저장"],
      ["8", "수소 저장"],
      ["9", "스마트 그리드"],
      ["10", "수요 반응"],
      ["11", "지역 간 전력 교환"],
      ["12", "탄소 가격"],
      ["13", "전력 시장"],
      ["14", "전환 로드맵"],
      ["15", "사례 연구"],
    ]);
  });
});
