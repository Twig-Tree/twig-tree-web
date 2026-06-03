import { NodeDTO } from "@/src/entities/tree/api/types";
import { TreeNode } from "../model/types";

/**
 * NodeDTO 배열을 TreeNode(Domain Entity) 배열로 일괄 변환합니다.
 */
export const mapNodesDtoToDomain = (dtos: NodeDTO[]): TreeNode[] => {
  return dtos
    .map((dto) => ({
      id: String(dto.nodeId), // number -> string
      parentId: dto.parentId !== null ? String(dto.parentId) : null, // parentId 변환
      data: {
        label: dto.name, // 백엔드 name을 label로 매핑
        orderIndex: dto.orderId ?? 0, // orderId를 orderIndex로 매핑
        memo: dto.memo ?? "", // 메모가 없을 경우 빈 문자열 처리[cite: 1]
      },
    }))
    .sort((a, b) => a.data.orderIndex - b.data.orderIndex);
};
