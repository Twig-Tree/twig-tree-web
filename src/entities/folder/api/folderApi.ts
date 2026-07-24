import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  CreateFolderRequest,
  CreateFolderResponse,
  GetFolderResponse,
  GetFolderListResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
} from "@/src/entities/folder/api/types";
import {
  mapFolderDtoToDomain,
  mapFolderListDtoToDomain,
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
};
