import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  CreateFolderRequest,
  CreateFolderResponse,
  DeleteFolderResponse,
  GetFolderResponse,
  GetFolderListResponse,
  GetFolderPathResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
} from "@/src/entities/folder/api/types";
import {
  mapFolderDtoToDomain,
  mapFolderListDtoToDomain,
  mapFolderPathDtoToDomain,
} from "@/src/entities/folder/lib/mappers";
import { FolderItem } from "@/src/entities/folder/model/types";

export const folderApi = {
  createFolder: async (body: CreateFolderRequest): Promise<FolderItem> => {
    const response = await axiosInstance.post<CreateFolderResponse>(
      "/folders",
      body,
    );
    return mapFolderDtoToDomain(response.data.data);
  },

  updateFolder: async (
    folderId: number,
    body: UpdateFolderRequest,
  ): Promise<FolderItem> => {
    const response = await axiosInstance.patch<UpdateFolderResponse>(
      `/folders/${folderId}`,
      body,
    );
    return mapFolderDtoToDomain(response.data.data);
  },

  deleteFolder: async (folderId: number): Promise<void> => {
    await axiosInstance.delete<DeleteFolderResponse>(`/folders/${folderId}`);
  },

  getFolder: async (folderId: number): Promise<FolderItem> => {
    const response = await axiosInstance.get<GetFolderResponse>(
      `/folders/${folderId}`,
    );
    return mapFolderDtoToDomain(response.data.data);
  },

  getFolderList: async (
    folderParentId: number | null,
  ): Promise<FolderItem[]> => {
    const response = await axiosInstance.get<GetFolderListResponse>(
      "/folders",
      {
        params: {
          folderParentId: folderParentId === null ? undefined : folderParentId,
        },
      },
    );
    return mapFolderListDtoToDomain(response.data.data);
  },

  getFolderPath: async (folderId: number): Promise<FolderItem[]> => {
    const response = await axiosInstance.get<GetFolderPathResponse>(
      `/folders/${folderId}/path`,
    );
    return mapFolderPathDtoToDomain(response.data.data.path);
  },
};
