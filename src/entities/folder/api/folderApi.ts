import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  CreateFolderRequest,
  CreateFolderResponse,
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

  getFolderList: async (
    folderParentId: number | null,
  ): Promise<FolderItem[]> => {
    const response = await axiosInstance.get("/folders", {
      params: {
        folderParentId: Number(folderParentId),
      },
    });
    return mapFolderListDtoToDomain(response.data.data);
  },
};
