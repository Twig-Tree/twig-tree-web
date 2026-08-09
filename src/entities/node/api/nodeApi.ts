import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { NodeDTO } from "@/src/entities/tree";
import { EditNodeNameRequest, EditNodeNameResponse } from "./types";

export const nodeApi = {
  /*
  URL에 treeId가 포함되지만 이 요청이 바꾸는 것은 노드의 속성이므로 노드 도메인에 둔다.
  */
  editNodeName: async (
    treeId: number,
    nodeId: number,
    body: EditNodeNameRequest,
  ): Promise<NodeDTO> => {
    const res = await axiosInstance.patch<EditNodeNameResponse>(
      `/trees/${treeId}/nodes/${nodeId}`,
      body,
    );
    return res.data.data;
  },
};
