import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { EditNodeNameRequest, EditNodeNameResponse } from "./types";
import { TreeNode } from "../model/types";
import { mapNodeDtoToDomain } from "../lib/mappers";

export const nodeApi = {
  /*
  URL에 treeId가 포함되지만 이 요청이 바꾸는 것은 노드의 속성이므로 treeApi가 아니라 nodeApi에 둔다.
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
