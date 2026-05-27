import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { CreateNodeRequest, TreeResponse } from "./types";
import { ApiResponse } from "@/src/shared/api/types";

export const treeApi = {
  getTree: async (treeId: string): Promise<TreeResponse> => {
    const res = await axiosInstance.get<ApiResponse<TreeResponse>>(
      `/trees/${treeId}/nodes`,
    );
    return res.data.data;
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
