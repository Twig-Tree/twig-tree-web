import { describe, it, expect } from "vitest";
import { hasCycle } from "./checkCycle";
import { NodeDTO } from "@/src/entities/tree/api/types";
import { mapNodesDtoToDomain } from "@/src/entities/tree/lib/mappers";
import { transformToFlowElements } from "@/src/features/tree-editor/lib/mappers";

describe("Tree Circular Reference Validation", () => {
  it("서버에서 온 정상 데이터를 UI 타입으로 매핑 후 Cycle이 없음을 확인한다", async () => {
    const response = await fetch("https://api.example.com/api/tree/34");
    const result = await response.json();
    const dtos: NodeDTO[] = result.data.nodes;

    // DTO를 도메인 모델로 변환
    const { nodes, edges } = transformToFlowElements(mapNodesDtoToDomain(dtos));
    // MSW 가짜 데이터가 순환 구조인 경우 감지되는지 확인
    expect(hasCycle(nodes, edges)).toBe(false);
  });

  it("순환 참조가 포함된 API 응답은 검사에서 true를 반환해야 한다", async () => {
    const response = await fetch(
      "https://api.example.com/api/tree/error/cycle",
    );
    const result = await response.json();
    const dtos: NodeDTO[] = result.data.nodes;

    const { nodes, edges } = transformToFlowElements(mapNodesDtoToDomain(dtos));

    expect(hasCycle(nodes, edges)).toBe(true);
  });
});
