import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  CreateNodeRequest,
  TreeDTO,
  GetTreeResponse,
  CreateTreeResponse,
  CreateNodeResponse,
} from "./types";
import { ApiResponse } from "@/src/shared/api/types";
import { TreeNode } from "../model/types";
import { mapNodeDtoToDomain, mapNodesDtoToDomain } from "../lib/mappers";

export const treeApi = {
  createTree: async (): Promise<TreeDTO> => {
    // todo: tree 생성 시 필요한 파라미터 추가
    const res = await axiosInstance.post<CreateTreeResponse>(
      `/tree-request?scenario=small`,
    );
    return res.data.data;
  },

  getTree: async (treeId: number): Promise<TreeNode[]> => {
    const res = await axiosInstance.get<GetTreeResponse>(
      `/trees/${treeId}/nodes`,
    );
    return mapNodesDtoToDomain(res.data.data.nodes);
  },

  createNode: async (
    treeId: number,
    body: CreateNodeRequest,
  ): Promise<TreeNode> => {
    const res = await axiosInstance.post<CreateNodeResponse>(
      `/trees/${treeId}/nodes`,
      body,
    );
    return mapNodeDtoToDomain(res.data.data);
  },

  deleteNode: async (treeId: number, nodeId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/trees/${treeId}/nodes/${nodeId}`,
    );
  },
};
