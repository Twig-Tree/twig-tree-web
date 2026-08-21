import { NodeDTO } from "@/src/entities/tree/api/types";
import { TreeNode } from "../model/types";

/**
 * 단일 NodeDTO를 TreeNode(Domain Entity)로 변환합니다.
 */
export const mapNodeDtoToDomain = (dto: NodeDTO): TreeNode => ({
  id: String(dto.nodeId), // number -> string
  parentId: dto.parentId !== null ? String(dto.parentId) : null, // parentId 변환
  data: {
    label: dto.name, // 백엔드 name을 label로 매핑
    orderIndex: dto.orderId ?? 0, // orderId를 orderIndex로 매핑
    memo: dto.memo, // 메모 없음(null)을 그대로 유지한다.
  },
});

/*
orderIndex 정렬은 여기서 하지 않는다. 배열 순서는 ELK가 형제 노드를 배치하는 기준이므로
화면에 넘기기 직전인 transformToFlowElements에서 한 번만 보장한다.
캐시는 순서를 약속하지 않으므로 mutation이 어느 위치에 노드를 추가해도 무방하다.
*/
export const mapNodesDtoToDomain = (dtos: NodeDTO[]): TreeNode[] =>
  dtos.map(mapNodeDtoToDomain);
