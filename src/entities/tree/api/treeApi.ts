import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  CreateNodeRequest,
  TreeDTO,
  NodeDTO,
  GetTreeResponse,
  CreateTreeResponse,
} from "./types";
import { ApiResponse } from "@/src/shared/api/types";

export const treeApi = {
  createTree: async (): Promise<TreeDTO> => {
    // todo: tree 생성 시 필요한 파라미터 추가
    const res = await axiosInstance.post<CreateTreeResponse>(
      `/tree-request?scenario=small`,
    );
    return res.data.data;
  },

  getTree: async (treeId: number): Promise<NodeDTO[]> => {
    const res = await axiosInstance.get<GetTreeResponse>(
      `/trees/${treeId}/nodes`,
    );
    return res.data.data.nodes;
  },

  createNode: async (
    treeId: string,
    body: CreateNodeRequest,
  ): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/trees/${treeId}/nodes`, body);
  },

  deleteNode: async (treeId: string, nodeId: string): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/trees/${treeId}/nodes/${nodeId}`,
    );
  },
};
