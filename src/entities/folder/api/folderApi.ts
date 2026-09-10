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

  /*
  함수 이름 : getFolder
  기능 : 폴더 ID로 폴더 하나를 조회한다.
  인자 : number folderId -> 조회할 폴더 ID
  반환값 : 조회한 폴더
  */
  getFolder: async (folderId: number): Promise<FolderItem> => {
    const response = await axiosInstance.get<GetFolderResponse>(
      `/folders/${folderId}`,
    );
    return mapFolderDtoToDomain(response.data.data);
  },

  /*
  함수 이름 : getFolderList
  기능 : 부모 폴더 기준으로 하위 폴더 목록을 조회한다. folderParentId가 null(루트)이면 쿼리
  파라미터 자체를 생략하며, 백엔드가 이 생략을 루트 폴더 목록 요청으로 해석한다.
  인자 : number | null folderParentId -> 조회할 부모 폴더 ID. 루트는 null
  반환값 : 하위 폴더 목록
  */
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

  /*
  함수 이름 : getFolderPath
  기능 : 해당 폴더 자신을 포함한 상위 경로를 루트부터 순서대로 조회한다.
  인자 : number folderId -> 경로의 끝이 될 폴더 ID
  반환값 : 루트부터 해당 폴더까지의 폴더 목록
  */
  getFolderPath: async (folderId: number): Promise<FolderItem[]> => {
    const response = await axiosInstance.get<GetFolderPathResponse>(
      `/folders/${folderId}/path`,
    );
    return mapFolderPathDtoToDomain(response.data.data.path);
  },
};
