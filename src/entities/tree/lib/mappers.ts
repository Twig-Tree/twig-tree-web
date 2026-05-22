import { NodeDTO } from "@/src/entities/tree/api/types";
import { TreeNode } from "../model/types";

/**
 * NodeDTO 배열을 TreeNode(Domain Entity) 배열로 일괄 변환합니다.
 */
export const mapNodesDtoToDomain = (dtos: NodeDTO[]): TreeNode[] => {
  return dtos
    .map((dto) => ({
      id: String(dto.node_id), // number -> string
      parentId: dto.parent_id !== null ? String(dto.parent_id) : null, // parent_id 변환
      data: {
        label: dto.title, // 백엔드 title을 label로 매핑
        orderIndex: dto.order_id ?? 0, // order_id를 orderIndex로 매핑
        memo: dto.memo ?? "", // 메모가 없을 경우 빈 문자열 처리[cite: 1]
      },
    }))
    .sort((a, b) => a.data.orderIndex - b.data.orderIndex);
};
