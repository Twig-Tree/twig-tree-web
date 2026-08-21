import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { TreeNode, mapNodeDtoToDomain } from "@/src/entities/tree";
import { EditNodeNameRequest, EditNodeNameResponse } from "./types";

export const nodeApi = {
  /*
  URL에 treeId가 포함되지만 이 요청이 바꾸는 것은 노드의 속성이므로 노드 도메인에 둔다.
  */
  editNodeName: async (
    treeId: number,
    nodeId: number,
    body: EditNodeNameRequest,
  ): Promise<TreeNode> => {
    const res = await axiosInstance.patch<EditNodeNameResponse>(
      `/trees/${treeId}/nodes/${nodeId}`,
      body,
    );
    return mapNodeDtoToDomain(res.data.data);
  },
};
