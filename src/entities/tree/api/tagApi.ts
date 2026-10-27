import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiResponse } from "@/src/shared/api/types";
import {
  AddNodeTagResponse,
  CreateTagRequest,
  CreateTagResponse,
  GetTreeTagsResponse,
} from "./types";
import { TreeTag } from "../model/types";
import { mapTagDtoToDomain } from "../lib/mappers";

/*
트리 태그와 노드-태그 연결을 한 파일에 둔다. 노드 태그 요청은 경로가 /nodes로 시작하지만
다루는 대상이 트리 태그와의 연결이라 nodeApi가 아니라 여기에 둔다.
*/
export const tagApi = {
  getTreeTags: async (treeId: number): Promise<TreeTag[]> => {
    const res = await axiosInstance.get<GetTreeTagsResponse>(
      `/trees/${treeId}/tags`,
    );
    return res.data.data.map(mapTagDtoToDomain);
  },

  createTreeTag: async (
    treeId: number,
    body: CreateTagRequest,
  ): Promise<TreeTag> => {
    const res = await axiosInstance.post<CreateTagResponse>(
      `/trees/${treeId}/tags`,
      body,
    );
    return mapTagDtoToDomain(res.data.data);
  },

  /*
  백엔드가 노드와의 연결도 함께 지운다.
  */
  deleteTreeTag: async (treeId: number, tagId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/trees/${treeId}/tags/${tagId}`,
    );
  },

  addNodeTag: async (nodeId: number, tagId: number): Promise<TreeTag> => {
    const res = await axiosInstance.post<AddNodeTagResponse>(
      `/nodes/${nodeId}/tags/${tagId}`,
    );
    return mapTagDtoToDomain(res.data.data);
  },

  removeNodeTag: async (nodeId: number, tagId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/nodes/${nodeId}/tags/${tagId}`,
    );
  },
};
